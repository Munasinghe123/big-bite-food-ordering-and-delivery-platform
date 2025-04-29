const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment');
const Order = require('../Models/Order');
const Menu = require('../Models/menuModel');

const generateReport = async (req, res) => {
  try {
    const popularItems = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.itemId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'menus',
          localField: '_id',
          foreignField: 'menuId',
          as: 'menuDetails'
        }
      },
      { $unwind: '$menuDetails' },
      { $project: { itemName: '$menuDetails.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const orderTrends = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) } 
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } }, 
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Build chart URLs using QuickChart
    const barChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
      type: 'bar',
      data: {
        labels: popularItems.map(i => i.itemName),
        datasets: [{
          label: 'Popular Items',
          data: popularItems.map(i => i.count),
          backgroundColor: 'rgba(75,192,192,0.6)'
        }]
      }
    }))}`;

    const lineChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
      type: 'line',
      data: {
        labels: orderTrends.map(day => day._id),
        datasets: [{
          label: 'Orders per Day',
          data: orderTrends.map(day => day.orderCount),
          borderColor: 'rgba(153, 102, 255, 1)',
          fill: false
        }]
      }
    }))}`;

    // Download chart images
    const [barChartResp, lineChartResp] = await Promise.all([
      axios.get(barChartUrl, { responseType: 'arraybuffer' }),
      axios.get(lineChartUrl, { responseType: 'arraybuffer' })
    ]);

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const filePath = path.join(__dirname, '../reports/report.pdf');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.image(path.join(__dirname, '../assets/BigBite.png'), 40, 40, { fit: [80, 80] });
    doc.fontSize(22).text('Order Report', 0, 50, { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${moment().format('YYYY-MM-DD')}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text('Charts Overview', { align: 'center' }).moveDown(1);
    doc.image(barChartResp.data, 40, doc.y, { fit: [240, 180] });
    doc.image(lineChartResp.data, 310, doc.y, { fit: [240, 180] });
    doc.moveDown(12);

    doc.fontSize(14).text('Orders Summary', { align: 'center' }).moveDown(1);

    const orders = await Order.find({}).sort({ orderTime: -1 }).limit(15).lean();
    const tableTop = doc.y;
    const colWidths = [120, 80, 120, 180]; 
    const startX = 40;
    
    const headerBgColor = '#d9d9d9';
    const evenRowColor = '#ffffff';
    const oddRowColor = '#f2f2f2';
    
    // Draw table header
    doc.font('Helvetica-Bold');
    doc.fontSize(14);
    doc.rect(startX, tableTop, colWidths.reduce((a, b) => a + b), 25).fill(headerBgColor).stroke();
    doc.fillColor('black')
      .text('Date', startX + 5, tableTop + 5, { width: colWidths[0] })
      .text('Total Items', startX + colWidths[0] + 5, tableTop + 5, { width: colWidths[1] })
      .text('Total Price (Rs.)', startX + colWidths[0] + colWidths[1] + 5, tableTop + 5, { width: colWidths[2] })
      .text('Customer Name', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 5, { width: colWidths[3] });
    
    let rowY = tableTop + 25;
    doc.font('Helvetica');
    doc.fontSize(10);
    
    // Draw each order row
    orders.forEach((order, index) => {
      const bgColor = index % 2 === 0 ? evenRowColor : oddRowColor;
      doc.rect(startX, rowY, colWidths.reduce((a, b) => a + b), 25).fill(bgColor).stroke();
      doc.fillColor('black')
        .text(moment(order.orderTime).format('YYYY-MM-DD'), startX + 5, rowY + 5, { width: colWidths[0] })
        .text(order.items.length.toString(), startX + colWidths[0] + 5, rowY + 5, { width: colWidths[1] })
        .text(`Rs. ${(order.totalAmount || 0).toFixed(2)}`, startX + colWidths[0] + colWidths[1] + 5, rowY + 5, { width: colWidths[2] })
        .text(order.customerName || 'N/A', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, rowY + 5, { width: colWidths[3] });
    
      rowY += 25;
    });
    
    doc.end();

    stream.on('finish', () => {
      res.download(filePath, 'order_report.pdf');
    });

  } catch (error) {
    console.error('Error generating report:', error.message);
    res.status(500).json({ success: false, message: `Failed to generate report: ${error.message}` });
  }
};

module.exports = { generateReport };

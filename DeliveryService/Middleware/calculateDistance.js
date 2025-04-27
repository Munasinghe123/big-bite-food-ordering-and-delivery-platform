const calculateDistance = (location1, location2) => {
  if (!location1?.latitude || !location1?.longitude || !location2?.latitude || !location2?.longitude) {
    throw new Error('Invalid or missing location data for distance calculation');
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const lat1 = toRadians(location1.latitude);
  const lat2 = toRadians(location2.latitude);
  const deltaLat = toRadians(location2.latitude - location1.latitude);
  const deltaLon = toRadians(location2.longitude - location1.longitude);

  const a = Math.sin(deltaLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

module.exports = calculateDistance;
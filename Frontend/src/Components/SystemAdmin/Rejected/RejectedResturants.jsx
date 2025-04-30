
import { useEffect,useState } from "react";
import axios from "axios";

import './RejectedResturants.css';

function RejectedResturants(){

    const [resturants,setResturants] = useState([]);

    useEffect(()=>{

        const fetchResturants = async () => {

            try{
                const response = await axios.get('http://localhost:30101/api/resturants/getRejectedResturant',
                    {withCredentials:true});
                
                console.log("rejected resturants",response.data.rejectedResturants);
                setResturants(response.data.rejectedResturants);    
            }catch(err){
                console.log(err);
                alert("Error fetching rejected resturants")
            }
        }

        fetchResturants();
    },[])

    return(
        <div className="rejected-resturants-container">
            <h1>Rejected resturants</h1>
            {resturants.length >0?(
                <div className="rejected-resturants">
                    <table className="rejected-resturanted-table">
                        <thead>
                            <tr>
                                <th>Restaurant name</th>
                                <th>Restaurant photo</th>
                                <th>Restaurant Location</th>
                                <th>Restaurant admin name</th>
                            </tr>
                        </thead>
                        <tbody>
                        {resturants.map((rest)=>{
                            return(
                                <>
                                <tr key={rest._id}>
                                    <td>{rest.restaurantName}</td>
                                    <td><img className="dp-photo" src={`http://localhost:30101/api/uploads/${rest.restaurantPhoto}`}/></td>
                                    <td>{rest.restaurantLocation}</td>
                                    <td>{rest.admin.name}</td>
                                </tr>
                                </>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            ):(
                <h3>No rejected restaurants</h3>
            )}
        </div>
        
    )
}

export default RejectedResturants;
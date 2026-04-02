const locationService = require('../services/location.service');

exports.createLocation = async (req,res)=>{
    try {
        const location = await locationService.createLocation(req.body);
        res.status(201).json({success:1,data:location.id});
    } catch (error) {
        res.status(500).json({success:0,message:error.message});
    }
}

exports.getAllLocations = async (req, res) => {
    try {
        const locations = await locationService.getAllLocations();
        res.status(200).json({ success: 1, data: locations });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};

exports.getLocationByID = async (req,res) =>{
    try{
        const location = await locationService.getLocationByID(req.params.id);
        if(!location){
            return res.status(404).json({ success: 0, message: "Location not found" });
        }
        res.status(200).json({success:1,data:location});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
}

exports.updateLocation = async (req,res) =>{
    try{
        const updatedLocation = await locationService.updateLocation(req.params.id,req.body);
        if(!updatedLocation){
            return res.status(404).json({ success: 0, message: "Location not found" });
        }
        res.status(200).json({success:1,data:updatedLocation});
    }catch(error){
        res.status(500).json({success:0,message:error.message});
    }
};

exports.deleteLocation= async (req, res) => {
    try {
        const deletedLocation = await locationService.deleteLocation(req.params.id);
        if (!deletedLocation) {
            return res.status(404).json({ success: 0, message: "Location not found" });
        }
        res.status(200).json({ success: 1, message: "Location deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: 0, message: error.message });
    }
};
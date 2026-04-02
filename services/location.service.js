const Location = require('../models/location.model');


exports.createLocation = async (locationData) =>{
    try {
        const location = new Location(locationData);
        return await location.save();
    } catch (error) {
        throw error;
    }
};

exports.getAllLocations = async () =>{
    try {
        return await Location.find(); 
    } catch (error) {
        return error;
    }
};


exports.getLocationByID = async (id) =>{
    try {
        return await Location.findById(id);
    } catch (error) {
        return error;
    }
};

exports.updateLocation = async (id,locationData)=>{
    try {
        return await Location.findByIdAndUpdate(id,locationData,{new:true});
    } catch (error) {
        return error;
    }
};

exports.deleteLocation = async (id)=>{
    try {
        return await Location.findByIdAndDelete(id);
    } catch (error) {
        return error;
    }
};
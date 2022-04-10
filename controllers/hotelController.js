const Hotel = require("../models/hotel");

exports.homePageFilters = async (req, res, next) => {
    try {
        console.log(process.env.USER);
        const hotels = Hotel.aggregate([
            { $match: { available: true} },
            { $sample: {size: 9} }
        ]);
        const countries = Hotel.aggregate([
            { $group: { _id: '$country' } },
            { $sample: {size: 9} }
        ]);

        const [filteredCountries, filteredHotels] = await Promise.all([countries, hotels]);

        res.render('index', { filteredCountries, filteredHotels });

    } catch(errors) {
        next(errors);
    }
}

exports.listAllHotels = async (req, res, next) => {
    try {
        const allHotels = await Hotel.find({ available: { $eq: true}});
        res.render('all_hotels', {title: 'All Hotels', allHotels});
    } catch(errors) {
        next(errors);
    }
}

exports.listAllCountries = async (req, res, next) => {
    try {
        const allCountries = await Hotel.distinct('country');
        res.render('all_countries', {title: 'Browse all country', allCountries});
    } catch(errors) {
        next(errors);
    }
}

exports.adminPage = (req, res) => {
    res.render('admin', {title: 'Admin'});
}

exports.createHotelGet = (req, res) => {
    res.render('add_hotel', {title: 'Add new hotel'});
}

exports.createHotelPost = async (req, res, next) => {
    try{
        const hotel = new Hotel(req.body);
        await hotel.save();
        req.flash('success', `${hotel.hotel_name} created successfully`);
        res.redirect(`/all/${hotel._id}`);
    } catch(errors) {
        next(errors);
    }
}

exports.editRemoveGet = (req, res) => {
    res.render('edit-remove', {title: 'Search for hotel to edit or remova'});
}

exports.editRemovePost = async (req, res, next) => {
    try {
        const hotelId = req.body.hotel_id || null;
        const hotelName = req.body.hotel_name || null;

        const hotelData = await Hotel.find( {$or: [
            { _id: hotelId },
            { hotel_name: hotelName }
        ]}).collation({
            locale: 'en',
            strength: 2
        });

        if(hotelData.length > 0) {
            res.render('hotel_detail', { title: 'Add / Remove Hotel', hotelData});
            return;
        } else {
            req.flash('info', 'No matches were found...');
            res.redirect('/admin/edit-remove');
        }

    } catch(errors) {
        next(errors);
    }
}

exports.updateHotelGet = async (req, res, next) => {
    try {
        const hotel = await Hotel.findOne({ _id: req.params.hotelId });
        res.render('add_hotel', {title: 'Update hotel', hotel});
    } catch(errors) {
        next(errors);
    }
}

exports.updateHotelPost = async (req, res, next) => {
    try {
        const hotelId = req.params.hotelId;
        const hotel = await Hotel.findByIdAndUpdate(hotelId, req.body, {new:true});
        req.flash('success', `${hotel.hotel_name} updated successfully`);
        res.redirect(`/all/${hotelId}`);
    } catch(errors) {
        next(errors);
    }
}

exports.deleteHotelGet = async (req, res, next) => {
    try {
        const hotelId = req.params.hotelId;
        const hotel = await Hotel.findOne( { _id: hotelId } );
        res.render('add_hotel', { title: 'Delet hotel', hotel });
    } catch(errors) {
        next(errors);
    }
}

exports.deleteHotelPost = async (req, res, next) => {
    try{
        const hotelId = req.params.hotelId;
        const hotel = await Hotel.findByIdAndRemove({_id: hotelId});
        req.flash('info', `Hotel ID : ${hotelId} has been deleted`);
        res.redirect('/');
    } catch(errors) {
        next(errors);
    }
}

exports.hotelDetail = async (req, res, next) => {
    try{
        const hotelParam = req.params.hotel;
        const hotelData = await Hotel.find( {_id: hotelParam} );
        res.render('hotel_detail', { title: 'Lets travel', hotelData });
    } catch(errors) {
        next(errors);
    }
}

exports.hotelsByCountry = async (req, res, next) => {
    try{
        const countryParam = req.params.country;
        const countryList = await Hotel.find( { country: countryParam});
        res.render('hotels_by_country', {title: `Browse by country: ${countryParam}`, countryList });
    } catch(errors) {
        next(errors);
    }
}

exports.searchResults = async (req, res, next) => {
    try{
        const searchQuery = req.body;
        const parsedStars = parseInt(searchQuery.stars) || 1; //convert string into int
        const parsedSort = parseInt(searchQuery.sort) || 1;

        const searchData = await Hotel.aggregate([
            { $match: { $text: {$search: `\"${searchQuery.destination}\"` } } }, //search for full text
            { $match: { available: true, star_rating: { $gte: parsedStars } } },
            { $sort: { cost_per_night: parsedSort } }
        ]);
        res.render('search_results', { title: 'Search results', searchQuery, searchData });

    } catch(errors) {
        next(errors);
    }
}
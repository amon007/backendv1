const mongoose = require('mongoose');

const Category = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    photo: {
        type: String
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Producte'
        }
    ]
});

const Categories = mongoose.model('Category', Category);

module.exports = Categories;
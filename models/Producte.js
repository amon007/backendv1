const {Schema, model} = require('mongoose')

const PhotoSchema = new Schema({
    url: { type: String, required: true},
    description: { type: String },
    isMain: { type: Boolean, default: false},
})

const Producte = new Schema({
    title: {type: String, require: true},
    description: {type: String, require: true},
    price: {type: String, require: true},
    photos: [PhotoSchema],
})

module.exports = model("Producte", Producte)
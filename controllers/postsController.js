const Producte = require("../models/Producte");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const uuid = require("uuid");
const path = require("path");
const fs = require("fs");
//fairbase
require("../firebase");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} = require("firebase/storage");
// const firebase = require('firebase/app');

// const firebaseConfig = {
//   apiKey: "AIzaSyCWNPDAUkf4q8uPf0HJH2LvBDZVvfuah4o",
//   authDomain: "naut-46217.firebaseapp.com",
//   projectId: "naut-46217",
//   storageBucket: "naut-46217.appspot.com",
//   messagingSenderId: "695614529926",
//   appId: "1:695614529926:web:6133aead662c0d9d0d0c07",
//   measurementId: "G-E4NJD0E1YW"
// };

// firebase.initializeApp(firebaseConfig);

const storage = getStorage();

class PostsController {
  async addProduct(req, res) {
    try {
      const { title, description, price, categoryID } = req.body;
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          message: "File not uploaded. Please choose a file to upload.",
        });
      }

      if (!title || !description || !price) {
        return res.status(400).json({
          message: "Empty string provided. Please provide valid content.",
        });
      }
      const photoArray = [];
      let img = req.files;
      // if(!Array.isArray(img)){
      //   img = [req.files.image];
      // }
      for (let key in img) {
        const file = img[key];
        console.log(file);
        const storageRef = ref(storage, uuid.v4() + file.name);
        await uploadBytes(storageRef, file.data);
        const url = await getDownloadURL(storageRef);
        const photo = {
          url: url,
          description: "Image description",
          isMain: false,
        };
        photoArray.push(photo);
      }

      const newProduct = new Producte({
        title,
        description,
        price,
        photos: photoArray,
      });
      await newProduct.save();
      try {
        const updatedCategory = await Category.findOneAndUpdate(
          { _id: categoryID },
          { $push: { products: newProduct._id } },
          { new: true }
        );
        if (!updatedCategory) {
          return res
            .status(500)
            .json({ message: "Error while adding a product to the category." });
        }

        return res
          .status(201)
          .json({ message: "Product successfully added to the category." });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ message: "Error while adding the product to the category." });
      }
    } catch (error) {
      return res.json(error);
    }
  }

  async deleteProduct(req, res) {
    try {
      const _id = req.query.id;
      const post = await Producte.findById(_id);

      if (!post) {
        return res.status(404).json({ message: "Post not found." });
      }
      await Category.updateMany(
        { products: _id },
        { $pull: { products: _id } }
      );
      for (const photo of post.photos) {
        try {
          const storageRef = ref(storage, photo.url);
          await deleteObject(storageRef);
        } catch (error) {
          console.log(error);
        }
      }

      await Producte.findOneAndDelete({ _id });

      return res
        .status(200)
        .json({ message: "Post and associated photos have been deleted." });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error deleting post and associated photos.", error });
    }
  }

  async getAllProducts(req, res) {
    try {
      //get page number from request
      const page = parseInt(req.query.page) || 1;
      //set a limit of elements //parseInt(req.query.limit) for user
      const limit = 20;
      //Calculate how many elements to skip
      const skip = (page - 1) * limit;

      //count users db document
      const totalCount = await Producte.countDocuments();

      //get users from db
      const posts = await Producte.find().skip(skip).limit(limit);

      if (posts.length < 1) {
        return res.status(404).json({ message: "Data not found on the page." });
      }

      //send response json
      return res.json({
        posts,
        currentPage: page,
        totalPage: Math.ceil(totalCount / limit),
      });
    } catch (error) {
      console.log(error);
    }
  }
  async getProductById(req, res) {
    try {
      const _id = req.query.id;
      const producte = await Producte.findById(_id);
      return res.status(200).json({ producte });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async addCategory(req, res) {
    try {
      const { name } = req.body;
      const file = req.files.image;
      if (!file && !name) {
        return res.status(400).json({ message: "Test error" });
      }

      if (!file) {
        return res.status(400).json({
          message: "File not uploaded. Please choose a file to upload.",
        });
      }

      if (!name) {
        return res.status(400).json({
          message: "Empty string provided. Please provide valid content.",
        });
      }

      const storageRef = ref(storage, uuid.v4() + file.name);
      await uploadBytes(storageRef, file.data);
      const url = await getDownloadURL(storageRef);
      const newCategory = new Category({
        name,
        photo: url,
      });
      newCategory.save();
      return res.status(201).json({ message: "Post created successfully." });
    } catch (error) {
      return res.json(error);
    }
  }

  async getAllCategory(req, res) {
    try {
      let category = await Category.find();
      return res.status(200).json(category);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getCategoryProducts(req, res) {
    try {
      const { id } = req.query;
      const ObjectId = mongoose.Types.ObjectId;
      const categoryId = new ObjectId(id);
      const category = await Category.findById(categoryId).populate("products");
      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }
      const productsInCategory = category.products;
      return res.json(productsInCategory);
    } catch (error) {
      console.log(error);
    }
  }

  async getAllProductsInCategory(req, res) {
    try {
      const { id, skip, limit } = req.query;
      if (skip < 0 || limit < 0)
        return res.json({ message: "Invalid parameters." });
      const ObjectId = mongoose.Types.ObjectId;
      const categoryId = new ObjectId(id);
      const category = await Category.findById(categoryId).populate({
        path: "products",
        options: { skip: parseInt(skip), limit: parseInt(limit) },
      });
      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }
      const productsInCategory = category.products;
      const categoryElement = await Category.findById(categoryId);
      const totalCount = categoryElement.products.length;
      const currentPage = Math.ceil((parseInt(skip) + 1) / parseInt(limit));
      const totalPages = Math.ceil(totalCount / parseInt(limit));
      return res.json({
        products: productsInCategory,
        currentPage,
        totalPages,
      });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteCategory(req, res) {
    const { id } = req.query;
    try {
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      try {
        const storageRef = ref(storage, category.photo);
        await deleteObject(storageRef);
      } catch (error) {
        console.log(error);
      }

      const ObjectId = mongoose.Types.ObjectId;
      const categoryId = new ObjectId(id);
      const products = await Category.findById(categoryId).populate("products");
      for (const product of products.products) {
        for (const photo of product.photos) {
          try {
            const storageRef = ref(storage, photo.url);
            await deleteObject(storageRef);
          } catch (error) {
            console.log(error);
          }
        }
        await Producte.findByIdAndDelete(product._id);
      }
      await category.deleteOne();
      return res
        .status(200)
        .json({ message: "Category and associated posts have been deleted." });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteImageInCategory(req, res) {
    const { productId, url } = req.body;

    try {
      if (!productId) {
        return res
          .status(400)
          .json({ message: "Product ID is required for deleting." });
      }

      const product = await Producte.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      if (!url) {
        return res
          .status(400)
          .json({ message: "Photo URL is required for deleting." });
      }

      if (product.product.length > 1) {
        product.product = product.product.filter((el) => el !== url);
        try {
          const storageRef = ref(storage, url);
          await deleteObject(storageRef);
        } catch (error) {
          console.log(error);
        }
      } else {
        return res
          .status(400)
          .json({
            message:
              "To delete you need more photos, if only 1 photo cannot be deleted, upload the photo then delete the rest.",
          });
      }

      await product.save();

      return res.status(200).json("Photo deleted successfully");
    } catch (error) {
      console.log(error);
    }
  }

  async changeCategory(req, res) {
    const { categoryId, name } = req.body;
    const image = req.files?.image;
    try {
      if (!categoryId) {
        return res
          .status(400)
          .json({ message: "Category ID is required for updating." });
      }

      const category = await Category.findById(categoryId);

      if (!category) {
        return res.status(404).json({ message: "Category not found." });
      }

      if (name) {
        category.name = name;
      }

      if (image) {
        try {
          const storageRef = ref(storage, category.photo);
          await deleteObject(storageRef);
        } catch (error) {
          console.log(error);
        }
        const storageRef = ref(storage, uuid.v4() + image.name);
        await uploadBytes(storageRef, image.data);
        const imageUrl = await getDownloadURL(storageRef);
        category.photo = imageUrl;
      }

      await category.save();

      return res
        .status(200)
        .json({ message: "Category updated successfully." });
    } catch (error) {
      console.log(error);
    }
  }

  async changeProduct(req, res) {
    const { productId, title, description, price } = req.body;

    try {
      if (!productId) {
        return res
          .status(400)
          .json({ message: "Product ID is required for updating." });
      }

      const product = await Producte.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      if (title) {
        product.title = title;
      }

      if (description) {
        product.description = description;
      }

      if (description) {
        product.price = price;
      }
      await product.save();
      return res.status(200).json({ message: "Product updated successfully." });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new PostsController();

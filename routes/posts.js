const Router = require('express')
const router = new Router()
const controller = require('../controllers/postsController')
const authMiddleware = require('../middlewaree/authMiddleware')
const roleMiddleware = require('../middlewaree/roleMiddleware')

//get products and delete products
router.post('/addproduct',controller.addProduct)
router.delete('/deleteproduct',controller.deleteProduct)
router.get('/getallproducts', controller.getAllProducts)
router.get('/getproductbyid', controller.getProductById)
//authMiddleware,roleMiddleware(['ADMIN']),
router.post('/addcategory',controller.addCategory)
router.delete('/deletecategory', controller.deleteCategory)
router.get('/getallcategory', controller.getAllCategory)
router.get('/getcategoryproducts', controller.getCategoryProducts)
router.get('/getproductsincategory', controller.getAllProductsInCategory)
router.put('/update/category', controller.changeCategory)
router.put('/update/product', controller.changeProduct)
router.delete('/deletephotoinproduct', controller.deleteImageInCategory)
module.exports = router
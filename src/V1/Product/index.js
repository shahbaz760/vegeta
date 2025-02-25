
import productController from './product.controller';
import schemaValidator from '../helpers/schemaValidator';
import { createProduct, listAllProducts, deleteProduct, updateProduct, createLineItems } from './product.validator';
import { getAccessRoles } from '../helpers/commonFunction';
import Authorization from '../helpers/authorization';

export default class Product {
    constructor(router, db) {
        this.authorization = new Authorization();
        this.router = router;
        this.db = db;
        this.productInstance = new productController()
    }
    async routes() {
        await this.productInstance.init(this.db)
        await this.authorization.init(this.db);

        let userAccess = await getAccessRoles(this.db);

        /** add Product */
        this.router.post('/product/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(createProduct), (req, res) => {
            this.productInstance.addProduct(req, res)
        });

        /** list all products */
        this.router.post('/product/list', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(listAllProducts), (req, res) => {
            this.productInstance.productList(req, res)
        });

        /** product detail */
        this.router.get('/product/detail/:product_id', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(listAllProducts), (req, res) => {
            this.productInstance.productDetail(req, res)
        });

        /** product delete */
        this.router.delete('/product/delete', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(deleteProduct),(req, res) => {
            this.productInstance.productDelete(req, res)
        });

        /** product update  */
        this.router.put('/product/update', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(updateProduct),(req, res) => {
            this.productInstance.productUpdate(req, res)
        });

        /** add LineItem */
        this.router.post('/line-item/add', await this.authorization.authorize([userAccess.Admin, userAccess.AccountManager]), schemaValidator(createLineItems), (req, res) => {
            this.productInstance.addLineItem(req, res)
        });


        /** list all products */
        this.router.post('/public-product/list', schemaValidator(listAllProducts), (req, res) => {
            this.productInstance.publicProductList(req, res)
        });

        
    }
}



require("dotenv").config();
import Services from "./product.services.js";
import { RESPONSE_CODES , PRODUCT_TYPE} from "../../../config/constants.js";
import {
  successResponse,
  errorResponse
} from "../../../config/responseHelper.js";
import { CommonMessages } from "../../../constants/message/common.js";
import { ProductMessages } from "../../../constants/message/product.js";
import moment from "moment";

export default class Product {
  async init(db) {
    this.services = new Services();
    this.Models = db.models;
    await this.services.init(db);
  }

  /* add product */
  async addProduct(req, res) {
    try {
      const { body, user } = req;
      body.user_id = user.id;
      body.type = PRODUCT_TYPE.GLOBAL_PRODUCT;
      await this.services.createProduct(body);
      return res
        .status(201)
        .send(
          successResponse(
            ProductMessages.PRODUCT_ADDED,
            {},
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


    /* Product list */
    async productList(req, res) {
      try {
        const { body } = req;
        const getProductlist = await this.services.getProductList(body);
        let getSubscriptionSetting = await this.services.getSubscriptionSettingDetail();
        return res.status(200).send({
          status: 1,
          message: ProductMessages.GET_LIST,
          code: RESPONSE_CODES.GET,
          data: getProductlist,
          subscription_setting: getSubscriptionSetting
        });

      } catch (error) {
        console.log(error, "====error===");
        return res
          .status(500)
          .send(
            errorResponse(
              CommonMessages.ERROR,
              null,
              RESPONSE_CODES.SERVER_ERROR
            )
          );
      }
    };



  /* Product list */
  async productDetail(req, res) {
    try {
      const { params } = req;
      const getProductDetail = await this.services.getProductById(params.product_id);
      if(!getProductDetail){
        return res
        .status(400)
        .send(
          errorResponse(
            ProductMessages.PRODUCT_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      return res
        .status(200)
        .send(
          successResponse(ProductMessages.GET_DATA, getProductDetail, RESPONSE_CODES.GET)
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };



  /* delete product */
  async productDelete(req, res) {
    try {
      const { body } = req;
      /** check product exist or not */
      const getProductDetail = await this.services.getProductById(body.product_id);
      if(!getProductDetail){
        return res
        .status(400)
        .send(
          errorResponse(
            ProductMessages.PRODUCT_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }
      const updateData = {
        deleted_at: moment(new Date()).unix(),
      };
      await this.services.updateProduct(updateData, body.product_id);
      return res
        .status(200)
        .send(
          successResponse(ProductMessages.PRODUCT_DELETE, {}, RESPONSE_CODES.POST)
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


  /* edit product info */
  async productUpdate(req, res) {
    try {
      const { body, user } = req;
      /** check product exist or not */
      const getProductDetail = await this.services.getProductById(body.product_id);
      if(!getProductDetail){
        return res
        .status(400)
        .send(
          errorResponse(
            ProductMessages.PRODUCT_NOT_FOUND,
            null,
            RESPONSE_CODES.BAD_REQUEST
          )
        );
      }

      if(body.billing_start_date != ""){
        body.billing_start_date = moment(new Date(body.billing_start_date), 'YYYY-MM-DD').unix();
      }else{
        body.billing_start_date = null
      }

      await this.services.updateProduct(body, body.product_id);
      let productDetail = await this.services.getProductById(body.product_id);
      productDetail.unit_discount_type = 0;
      productDetail.unit_discount = 0;
      productDetail.net_price = 0;
      return res
        .status(201)
        .send(
          successResponse(
            ProductMessages.PRODUCT_UPDATE,
            productDetail,
            RESPONSE_CODES.POST
          )
        );
  } catch (error) {
    console.log(error, "====error====")
    return res
      .status(500)
      .send(
        errorResponse(
          CommonMessages.ERROR,
          null,
          RESPONSE_CODES.SERVER_ERROR
        )
      );
  }
};


  /* add line item */
  async addLineItem(req, res) {
    try {
      const { body, user } = req;
      body.user_id = user.id;
      body.type = PRODUCT_TYPE.LINE_ITEM;
      if(body.billing_start_date !=""){
 
        let getDate = new Date(body.billing_start_date);
        let currentDate = new Date();
        if(getDate <= currentDate) {
          return res
          .status(400)
          .send(
            errorResponse(
              "Please select future date for start billing.",
              null,
              RESPONSE_CODES.BAD_REQUEST
            )
          );
        }

        body.billing_start_date = moment(new Date(body.billing_start_date)).unix();
      }else {
        body.billing_start_date = null;
      }
      let createLineItem = await this.services.createProduct(body);
      let getProductDetail = await this.services.getProductById(createLineItem.id);
      getProductDetail.unit_discount_type = 0;
      getProductDetail.unit_discount = 0;
      getProductDetail.net_price = 0;

      return res
        .status(201)
        .send(
          successResponse(
            ProductMessages.LINE_ITEM_ADDED,
            getProductDetail,
            RESPONSE_CODES.POST
          )
        );
    } catch (error) {
      console.log(error, "===error==")
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


  /* Product list */
  async publicProductList(req, res) {
    try {
      const { body } = req;
      const getProductlist = await this.services.getPubliceProductList(body);
      let getSubscriptionSetting = await this.services.getSubscriptionSettingDetail();
      return res.status(200).send({
        status: 1,
        message: ProductMessages.GET_LIST,
        code: RESPONSE_CODES.GET,
        data: getProductlist,
        subscription_setting: getSubscriptionSetting
      });

    } catch (error) {
      console.log(error, "====error===");
      return res
        .status(500)
        .send(
          errorResponse(
            CommonMessages.ERROR,
            null,
            RESPONSE_CODES.SERVER_ERROR
          )
        );
    }
  };


}

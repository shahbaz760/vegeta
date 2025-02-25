import sequelize from 'sequelize';
const Op = sequelize.Op;
import { PAGINATION, PRODUCT_TYPE, RESPONSE_CODES, ROLES } from '../../../config/constants';
import path from "path";
import moment from "moment";

export default class Product {
  async init(db) {
    this.Models = db.models;
  }

  /** create product */
  createProduct = async (data) => {
    return await this.Models.LineItems.create(data);
  };

  /** get product by name*/
  getProductByName = async (name) => {
    return this.Models.LineItems.findOne({ 
      where: { 
        name: name,
      }, 
    raw: true });
  };

  /** get all product list with pagination and search filter and total count*/
  getProductList = async (body) => {
    let whereCondition = {
      deleted_at: null,
      type: PRODUCT_TYPE.GLOBAL_PRODUCT
    };

    let withoutSearchCondition = {
      deleted_at: null,
      type: PRODUCT_TYPE.GLOBAL_PRODUCT,
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: `%${body.search}%` } },
        ],
        type: PRODUCT_TYPE.GLOBAL_PRODUCT,
        deleted_at: null,
      }
    }

    if(body.is_edit && body.is_edit == 1) {
      whereCondition.billing_frequency = {
        [Op.ne]: 1
      };
    }
    /** Get Only public products */
    if(body.is_public && body.is_public == 1) {
      whereCondition.is_private = 0;
      withoutSearchCondition.is_private = 0;
    }

    const allProductCount = await this.Models.LineItems.count({
      where: whereCondition,
    });

    const allProductCountWithoutSearch = await this.Models.LineItems.count({
      where: withoutSearchCondition
    });

    const currentDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const getAllProducts = await this.Models.LineItems.findAll({
      attributes: {include: [[sequelize.literal("0"), "unit_discount_type"],[sequelize.literal("0"), "unit_discount"],[sequelize.literal("0"), "net_price"],[sequelize.literal(`
      CASE
        WHEN DATE_FORMAT(FROM_UNIXTIME(line_items.billing_start_date), '%Y-%m-%d') <= '${currentDate}'
        THEN ''
        ELSE DATE_FORMAT(FROM_UNIXTIME(line_items.billing_start_date), '%Y-%m-%d')
      END
    `), 'billing_start_date']]},
      where: whereCondition,
      order: [
        ['id', 'DESC'],
      ], 
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allProductCount : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: getAllProducts, total_records: allProductCount,total_count : allProductCountWithoutSearch, filtered_records: getAllProducts.length }
  };

  /** get product by id*/
  getProductById = async (productId) => {

    const currentDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return this.Models.LineItems.findOne({ 
      attributes: {include: [[sequelize.literal(`
      CASE
        WHEN DATE_FORMAT(FROM_UNIXTIME(line_items.billing_start_date), '%Y-%m-%d') <= '${currentDate}'
        THEN ''
        ELSE DATE_FORMAT(FROM_UNIXTIME(line_items.billing_start_date), '%Y-%m-%d')
      END
    `), 'billing_start_date']]},
      where: { 
        id: productId,
        deleted_at: null
      }, 
    raw: true });
  };

  /** update product by condition*/
  updateProduct = async (data, productId) => {
    return await this.Models.LineItems.update(data, { where: { id: productId } });
  };

   /**Get subscription setting detail*/
   getSubscriptionSettingDetail = async () => {
    return this.Models.SubscriptionSettings.findOne({
      attributes: ["global_processing_fee_description", "global_processing_fee"], 
      where: {
        deleted_at: null
      },
      raw: true
    });
  };



  /** get all product list with pagination and search filter and total count*/
  getPubliceProductList = async (body) => {
    let whereCondition = {
      deleted_at: null,
      type: PRODUCT_TYPE.GLOBAL_PRODUCT,
      is_private: 0
    };

    let withoutSearchCondition = {
      deleted_at: null,
      type: PRODUCT_TYPE.GLOBAL_PRODUCT,
      is_private: 0
    };

    if (body.search) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: `%${body.search}%` } },
        ],
        type: PRODUCT_TYPE.GLOBAL_PRODUCT,
        deleted_at: null,
        is_private: 0
      }
    }

    const allProductCount = await this.Models.LineItems.count({
      where: whereCondition,
    });

    const allProductCountWithoutSearch = await this.Models.LineItems.count({
      where: withoutSearchCondition
    });

    const currentDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const getAllProducts = await this.Models.LineItems.findAll({
      attributes: {include: [[sequelize.literal("0"), "unit_discount_type"],[sequelize.literal("0"), "unit_discount"],[sequelize.literal("0"), "net_price"],[sequelize.literal(`
      CASE
        WHEN DATE_FORMAT(FROM_UNIXTIME(line_items.billing_start_date), '%Y-%m-%d') <= '${currentDate}'
        THEN ''
        ELSE DATE_FORMAT(FROM_UNIXTIME(line_items.billing_start_date), '%Y-%m-%d')
      END
    `), 'billing_start_date']]},
      where: whereCondition,
      order: [
        ['id', 'DESC'],
      ], 
      offset: (parseInt(body.start) == 0) ? 0 : (parseInt(body.start) || PAGINATION.START) * (parseInt(body.limit) || PAGINATION.LIMIT) || PAGINATION.START,
      limit: (body.limit == -1) ? allProductCount : parseInt(body.limit) || PAGINATION.LIMIT,
      raw: true,
    });

    return { list: getAllProducts, total_records: allProductCount,total_count : allProductCountWithoutSearch, filtered_records: getAllProducts.length }
  };

}

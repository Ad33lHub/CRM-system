// Shared JSDoc type definitions for editor IntelliSense. No runtime cost.

/**
 * @typedef {'super_admin'|'admin'|'manager'|'developer'|'designer'|'qa_engineer'|'client'} UserRole
 */

/**
 * @typedef {Object} ApiSuccess
 * @property {true} success
 * @property {string} message
 * @property {*} data
 */

/**
 * @typedef {Object} ApiError
 * @property {false} success
 * @property {string} message
 * @property {{ code: string, statusCode: number, fields?: Object }} error
 */

/**
 * @typedef {Object} Pagination
 * @property {number} page
 * @property {number} limit
 * @property {number} totalItems
 * @property {number} totalPages
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 */

export {};

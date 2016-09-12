'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var emailSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

/**
 * Document Schema
 */
var DocumentSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },

    title: {
        type: String,
        default: '',
        trim: true,
        required: 'Title cannot be blank'
    },
    slug: {
        type: String,
        index: { unique: true, sparse: true },
        default: '',
        trim: true,
        required: 'Slug cannot be blank'
    },
    content: {
        type: String,
        default: '',
        trim: true
    },
    profileImageURL: {
        type: String,
        default: 'modules/users/client/img/profile/default.png'
    },
    gallery: [],
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

mongoose.model('Document', DocumentSchema);

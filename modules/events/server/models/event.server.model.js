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
 * Event Schema
 */
var EventSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    date: {
        type: Date
    },
    focus: {
        type: Boolean
    },
    image: [],
    title: {
        type: String,
        default: '',
        trim: true,
        required: 'Title cannot be blank'
    },
    slug: {
        type: String,
        unique: 'Slug already exists',
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
    applications: [ { type: Schema.ObjectId, ref: 'User' } ],
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

mongoose.model('Event', EventSchema);

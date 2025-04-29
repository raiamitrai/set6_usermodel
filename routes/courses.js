const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated } = require('../config/auth');
const Course = require('../models/Course');

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: 'desc' });
        res.render('courses/index', { courses });
    } catch (err) {
        req.flash('error_msg', 'Error fetching courses');
        res.redirect('/');
    }
});

// New course form
router.get('/new', ensureAuthenticated, (req, res) => {
    res.render('courses/new');
});

// Create new course
router.post('/', ensureAuthenticated, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            req.flash('error_msg', err);
            return res.redirect('/courses/new');
        }

        if (!req.file) {
            req.flash('error_msg', 'Please upload an image');
            return res.redirect('/courses/new');
        }

        try {
            const newCourse = new Course({
                courseName: req.body.courseName,
                price: req.body.price,
                image: `/uploads/${req.file.filename}`,
                duration: req.body.duration,
                courseStartDate: req.body.courseStartDate
            });

            await newCourse.save();
            req.flash('success_msg', 'Course created successfully');
            res.redirect('/courses');
        } catch (err) {
            req.flash('error_msg', 'Error creating course');
            res.redirect('/courses/new');
        }
    });
});

// Show course
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/courses');
        }
        res.render('courses/show', { course });
    } catch (err) {
        req.flash('error_msg', 'Error fetching course');
        res.redirect('/courses');
    }
});

// Edit course form
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/courses');
        }
        res.render('courses/edit', { course });
    } catch (err) {
        req.flash('error_msg', 'Error fetching course');
        res.redirect('/courses');
    }
});

// Update course
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/courses');
        }

        // Only update allowed fields
        course.price = req.body.price;
        course.duration = req.body.duration;
        course.courseStartDate = req.body.courseStartDate;

        await course.save();
        req.flash('success_msg', 'Course updated successfully');
        res.redirect(`/courses/${course.id}`);
    } catch (err) {
        req.flash('error_msg', 'Error updating course');
        res.redirect(`/courses/${req.params.id}/edit`);
    }
});

// Delete course
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error_msg', 'Course not found');
            return res.redirect('/courses');
        }

        // Delete image file
        if (course.image) {
            const imagePath = path.join(__dirname, '../public', course.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await course.remove();
        req.flash('success_msg', 'Course deleted successfully');
        res.redirect('/courses');
    } catch (err) {
        req.flash('error_msg', 'Error deleting course');
        res.redirect('/courses');
    }
});

module.exports = router; 
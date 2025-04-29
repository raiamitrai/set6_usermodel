const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

// Register Page
router.get('/register', (req, res) => {
    res.render('register');
});

// Register Handle
router.post('/register', async (req, res) => {
    const { username, password, gender, number } = req.body;
    
    try {
        const userExists = await User.findOne({ username });
        
        if (userExists) {
            req.flash('error_msg', 'Username already exists');
            return res.redirect('/users/register');
        }

        const newUser = new User({
            username,
            password,
            gender,
            number,
            coursesEnrolled: []
        });

        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error in registration');
        res.redirect('/users/register');
    }
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return next(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
});

module.exports = router; 
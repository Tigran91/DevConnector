const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load validation
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

// Load Profile Model
const Profile = require("../../models/Profile");
// Load User Model
const User = require("../../models/User");

// @route  GET api/profile/test
// @desc   Tests profile route
// @access Public

router.get("/test", (req, res) => res.json({ msg: "Profile Works" }));

// @route  GET api/profile
// @desc   Get current user profile
// @access Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route  GET api/profile/handle/:handle
// @desc   Get profile by handle
// @access Public

router.get("/handle/:handle", (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["user", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = " There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route  GET api/profile/all
// @desc   Get all profiles
// @access Public
router.get("/all", (req, res) => {
  const errors = {};

  Profile.find()
    .populate("name", ["name", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = "There are no profiles";
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profile: "There are no profiles" }));
});

// @route  GET api/profile/user/:user_id
// @desc   Get profile by user ID
// @access Public

router.get("/user/:user_id", (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["user", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = " There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route  POST api/profile
// @desc   Create/Edit user profile
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors
      return res.status(400).json(errors);
    }
    // Get fields
    const profileField = {};
    profileField.user = req.user.id;
    if (req.body.handle) profileField.handle = req.body.handle;
    if (req.body.company) profileField.company = req.body.company;
    if (req.body.website) profileField.website = req.body.website;
    if (req.body.location) profileField.location = req.body.location;
    if (req.body.bio) profileField.bio = req.body.bio;
    if (req.body.status) profileField.status = req.body.status;
    if (req.body.githubusername)
      profileField.githubusername = req.body.githubusername;
    // split in array
    if (typeof req.body.skills !== "undefined") {
      profileField.skills = req.body.skills.split(",");
    }
    // Social
    profileField.social = {};
    if (req.body.youtube) profileField.social.youtube = req.body.youtube;
    if (req.body.twitter) profileField.social.twitter = req.body.twitter;
    if (req.body.facebook) profileField.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileField.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileField.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileField },
          { new: true }
        ).then(profile => res.json(profile));
      } else {
        // Create
        // Check if handle exists
        Profile.findOne({ handle: profileField.handle }).then(profile => {
          if (profile) {
            errors.handle = "That handle already exists";
            res.status(400).json(errors);
          }

          // Save profile
          new Profile(profileField).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

// @route  POST api/profile/experience
// @desc   Add experiense to profile
// @access Private
router.post(
  "/experience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const nexExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to experience array
      profile.experience.unshift(nexExp);

      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route  POST api/profile/education
// @desc   Add education to profile
// @access Private
router.post(
  "/education",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    // Check validation
    if (!isValid) {
      // Return any errors
      return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id }).then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      };

      // Add to experience array
      profile.education.unshift(newEdu);

      profile.save().then(profile => res.json(profile));
    });
  }
);

// @route  DELETE api/profile/experience/:exp_id
// @desc   Delete experience from profile
// @access Private
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.experience.splice(removeIndex, 1);
        //
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route  DELETE api/profile/education/:edu_id
// @desc   Delete education from profile
// @access Private
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        // Splice out of array
        profile.education.splice(removeIndex, 1);
        //
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route  DELETE api/profile
// @desc   Delete user and profile
// @access Private
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() =>
        res.json({ success: true })
      );
    });
  }
);

module.exports = router;

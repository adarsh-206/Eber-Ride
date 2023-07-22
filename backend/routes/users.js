const express = require("express");
const mongoose = require("mongoose");
const userRoutes = express.Router()
const userModel = require("../models/users");
const multer = require('multer');
const path = require('path');
const profile_path = path.join(__dirname, "../Public/Profile");


//---------------------------------------MULTER CODE FOR IMAGE UPLOAD---------------------------------------//
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(file)
    cb(null, profile_path);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    console.log(file)
    let fileName = file.fieldname + '-' + Date.now() + ext;
    req.body.profile = fileName
    console.log(req.body.profile);
    cb(null, fileName);

  }
});

const fileFilter = function (req, file, cb) {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, WEBP and GIF files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: fileFilter
});



//-----------------------------------------------ADD USER----------------------------------------------//
userRoutes.post('/adduser', async (req, res, next) => {
  upload.single('profile')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: "File size exceeds the limit (2MB)." });
      }
      return res.status(400).json({ success: false, message: "Unexpected error while uploading the file." });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { username, useremail, countrycode, userphone } = req.body;
  let newUser;
  try {
    if (!req.file) {
      newUser = new userModel({ username: username, useremail: useremail, countrycode: countrycode, userphone: userphone });
    } else {
      const profile = req.file.filename;
      console.log(profile);
      newUser = new userModel({ profile: profile, username: username, useremail: useremail, countrycode: countrycode, userphone: userphone });
    }

    await newUser.save()
    console.log(newUser)
    res.status(201).json({ success: true, message: 'User Added Successfully', newUser });
  } catch (error) {
    if (error.keyPattern) {
      console.log(error)
      return res.status(500).json({ success: false, message: "User Already Exists" });
    }
    res.status(500).json({ success: false, message: error });
  }
});


//-----------------------------------------------GET ALL USERS----------------------------------------------//
// userRoutes.get('/userdata', async (req, res) => {
//   try {
//     const userdata = await userModel.find({});
//     // res.json({ userdata });
//     res.send(userdata)
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: error});
//   }
//   });


// ---------------------------------------------DELETE USER----------------------------------------------//
userRoutes.delete('/userdata/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await userModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ success: true, message: 'User Deleted Successfully' });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error });
  }
});



// ---------------------------------------------UPDATE USER----------------------------------------------//
userRoutes.put('/updateuser/:id', upload.single('profile'), async (req, res) => {
  // console.log(req.body)
  // console.log(req.file)
  const { updateusername, updateuseremail, updatecountrycode, updateuserphone } = req.body;

  try {
    const userId = req.params.id;
    console.log(userId)
    let updatedUser;

    if (!req.file) {
      const user = { username: updateusername, useremail: updateuseremail, countrycode: updatecountrycode, userphone: updateuserphone }
      updatedUser = await userModel.findByIdAndUpdate(userId, user, { new: true })
    }
    else {
      console.log(req.file.filename)
      const user = { profile: req.file.filename, username: updateusername, useremail: updateuseremail, countrycode: updatecountrycode, userphone: updateuserphone }
      updatedUser = await userModel.findByIdAndUpdate(userId, user, { new: true })
    }

    res.json({ success: true, message: "User Updated Successfully", updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "User Already Exists" });
  }
});


// ---------------------------------------------SEARCH USER----------------------------------------------//
// userRoutes.get('/usersearch', async (req, res) => {
//   try {
//     const query = req.query;
//     const currentPage = parseInt(query.currentPage) || 1;
//     const limit = parseInt(query.limit) || 5;
//     const skip = (currentPage - 1) * limit;
//     const { sortColumn, sortOrder } = req.query;

//     console.log(query)

//     const searchData = {
//       $or: [
//         { username: { $regex: query.query, $options: 'i' } },
//         { userphone: { $regex: query.query, $options: 'i' } },
//         { useremail: { $regex: query.query, $options: 'i' } },
//       ],
//     };

//     // Check if the query is a valid ObjectId
//     if (mongoose.Types.ObjectId.isValid(query.query)) {
//       searchData.$or.push({ _id: query.query });
//     }

//     const count = await userModel.countDocuments(searchData);
//     const totalPages = Math.ceil(count / limit);

//     const sortObject = {};
//     // sortObject[sortColumn] = sortOrder === 'asc' ? 1 : -1;
//     sortObject['username'] = 1;

//     const userdata = await userModel.find(searchData).skip(skip).limit(limit).sort(sortObject);

//     // console.log(userdata)

//     res.json({ success: true, message: 'User Data found from Search', userdata, totalPages });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: error });
//   }
// });


// ---------------------------------------------GET USER DATA PAGINATION----------------------------------------------//
// userRoutes.get('/userdata', async (req, res) => {
//   try {
//     const { page, limit } = req.query;
//     const pageNumber = parseInt(page) || 1;
//     const limitNumber = parseInt(limit) || 5;

//     const totalUsers = await userModel.countDocuments({});
//     const totalPages = Math.ceil(totalUsers / limitNumber);

//     const userdata = await userModel
//       .find({})
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber);

//       console.log(userdata)
//       res.json({
//         success: true,
//         message: 'Users Retrieved Successfully',
//         page: pageNumber,
//         limit: limitNumber,
//         totalPages: totalPages,
//         userdata: userdata
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: error });
//   }
// });



// --------------------------------GET USER DATA, SEARCH, PAGINATION, SORT-----------------------------------//
userRoutes.get("/userdata", async (req, res) => {
  let page = +req.query.page || 1;
  let limit = +req.query.limit || 5;
  let search = req.query.search;
  let sortBy = req.query.sortBy || "username";
  let sortOrder = req.query.sortOrder || "desc";
  let skip = (page - 1) * limit;

  try {
    let query = {};

    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { useremail: { $regex: search, $options: "i" } },
          { userphone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const count = await userModel.find(query).count();
    let totalPage = Math.ceil(count / limit);

    if (page > totalPage) {
      page = totalPage;
      skip = (page - 1) * limit;
    }

    let sortCriteria = {};

    if (sortBy === "name") {
      sortCriteria = { username: sortOrder === "asc" ? 1 : -1 };
    } else if (sortBy === "email") {
      sortCriteria = { useremail: sortOrder === "asc" ? 1 : -1 };
    } else if (sortBy === "phone") {
      sortCriteria = { userphone: sortOrder === "asc" ? 1 : -1 };
    }


    // let userdata = await userModel.find(query).limit(limit).skip(skip).sort({ username : -1, _id: 1 })
    let userdata = await userModel.find(query).limit(limit).skip(skip).sort(sortCriteria)

    res.json({
      success: true,
      message: "Data Found",
      userdata,
      page,
      limit,
      totalPage,
      count,
    });
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

// ---------------------------GET USER DETAILS FROM PHONE NUMBER----------------------------------//
userRoutes.post('/userdata/number', async (req, res) => {
  const { countrycode, userphone } = req.body;
  // console.log(req.body);
  try {
    const user = await userModel.findOne(req.body)
    if (!user) {
      return res.status(404).send({ message: "No user found" });
    }
    console.log(user)
    res.send(user)
  } catch (error) {
    res.status(500).send(error)
  }
})

module.exports = userRoutes;



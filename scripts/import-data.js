const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');

dotenv.config({ path: './config.env' });

const dbUrl = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    // this return a object.
    console.log('DB connection succesfully');
  });

const createTours = async () => {
  const tourData = await JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours.json`, 'utf-8')
  );
  const userData = await JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf-8')
  );
  const reviewsData = await JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/reviews.json`, 'utf-8')
  );
  await Tour.create(tourData, { validateBeforeSave: false });
  await User.create(userData, { validateBeforeSave: false });
  await Review.create(reviewsData);
  console.log('Data succesfully loaded');
  process.exit();
};

const deleteTours = async () => {
  await Tour.deleteMany();
  await User.deleteMany();
  await Review.deleteMany();
  console.log('Data succesfully deleted');
  process.exit();
};

if (process.argv[2] === '--create') {
  createTours();
} else if (process.argv[2] === '--delete') {
  deleteTours();
}

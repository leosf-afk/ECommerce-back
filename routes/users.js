const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next){
    res.render('respond with a resource');
});



module.exports = router;
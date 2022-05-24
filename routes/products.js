const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');





// get all products
router.get('/', function(req, res){
    let page =  (req.query.page != undefined && req.query.page != 0) ? req.query.page : 1;
    const limit = (req.query.limit != undefined && req.query.page != 0) ? req.query.limit : 10; // limit for page
    
    let startValue;
    let endValue;

    if (page > 0) {
        startValue = (page * limit) - limit; // 0, 10, 20, 30
        endValue = page * limit;
    }else{
        startValue = 0;
        endValue = 10;
    }

    database.table('productos as p')
    .join([{
        table: 'categorias as c',
        on: 'c.id = p.cat_id'
    }])
    .withFields(['c.nombre as categorias',
    'p.nombre',
    'p.precio',
    'p.imagen',
    'p.id'
])
.slice(startValue, endValue)
.sort({id: .1})
.getAll()
.then(prods =>{
    if(prods.length > 0){
        res.status(200).json({
            count: prods.length,
            productos: prods
        });
    } else{
        res.json({message: "No se encontaron productos"});
    }
})
.catch(err => console.log(err));



});




module.exports = router;
const express = require('express');
const { json } = require('express/lib/response');
const { parse } = require('path');
const router = express.Router();
const {database} = require('../config/helpers');





// get all products ///////////
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
    // 'p.esta_eliminado'
])
.slice(startValue, endValue)
.sort({id: .1})
//filter if the product exist
.filter({'p.esta_eliminado' : 0 } )
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



// select product by category ;) //////////

router.get('/category/:catName', (req, res) => { 
    let page = (req.query.page !== undefined && req.query.page !== 0) ? req.query.page : 1;   
    const limit = (req.query.limit !== undefined && req.query.limit !== 0) ? req.query.limit : 10;  
    let startValue;
    let endValue;
    if (page > 0) {
        startValue = (page * limit) - limit;      
        endValue = page * limit;                 
    } else {
        startValue = 0;
        endValue = 10;
    }


    const cat_title = req.params.catName;

    database.table('productos as p')
        .join([
            {
                table: "categorias as c",
                on: `c.id = p.cat_id WHERE c.nombre LIKE '%${cat_title}%' AND p.esta_eliminado = 0`
            }
        ])
        .withFields(['c.nombre as categoria',
            'p.nombre as nombre',
            'p.precio',
            'p.stock',
            'p.descripcion',
            'p.imagen',
            'p.id'
        ])
        .slice(startValue, endValue)
        .sort({id: 1})
        .getAll()
        .then(prods => {
            if (prods.length > 0) {
                res.status(200).json({
                    count: prods.length,
                    productos: prods
                });
            } else {
                res.json({message: `No products found matching the category ${cat_title}`});
            }
        }).catch(err => res.json(err));

});






// new product /////////

router.post('/new', async (req,res) =>{    
let {Nombre, Descripcion, Cat}= req.body;
console.log(Nombre);
console.log(Descripcion);
console.log(Cat);


let id_cat = await database.table('categorias').filter({id : Cat}).withFields(['id']).get();

//  id_cat=JSON.parse(JSON.stringify(id_cat))

let value = 0;


try {
    value = Object.values(JSON.parse(JSON.stringify(id_cat)))

   
}catch (err) {
    console.log('Error: ', err.message);
}

if (Cat != null && Cat == value){
                
    database.table('productos')
    .insert({
        cat_id: Cat,
        nombre: Nombre,
        Descripcion: Descripcion
    }).then(
        res.json({message: `success`})
    )
} else{
    res.json({message: `please select a category`});
    console.log(value);

}           


                
        //     console.log(id_cat)

        // console.log(`id is ${value}`);

    




});



module.exports = router;
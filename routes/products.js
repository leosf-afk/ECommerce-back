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
let {nombre, descripcion, cat}= req.body;
console.log(nombre);
console.log(descripcion);
console.log(cat);



let id_cat = await database.table('categorias').filter({id : cat}).withFields(['id']).get();

let value;

try {
     value = id_cat.id;

    
} catch (err) {
    console.log('Error: ', err.message);

}


if (value == cat && value != undefined && value > 0) {

    database.table('productos')
    .insert({
        cat_id: cat,
        nombre: nombre,
        Descripcion: descripcion
    }).then(
        res.json({message: `success`})
    )
    
}
else{
    res.json({message: "the category doesn't exist or it's incorrect"});
}


// if (Cat != null && Cat == id_cat.id ){
                
//     database.table('productos')
//     .insert({
//         cat_id: Cat,
//         nombre: Nombre,
//         Descripcion: Descripcion
//     }).then(
//         res.json({message: `success`})
//     )
// } else{
//     res.json({message: `please select a category`});

// }                           
       
});


// edit product ////////

router.put('/update/:productId', async (req, res) =>{
    let productId = req.params.productId;

    // search the product
    let product = await database.table('productos').filter({id: productId}).get();

    if(product) {
        let nombreProducto = req.body.nombre;
        let descripcionProducto = req.body.descripcion;
        let precioProducto = req.body.precio;
        let stockProducto= req.body.stock;
        let imagenProducto = req.body.imagen;
        let talleProducto= req.body.talle;
        let marcaProducto= req.body.marca;
        let cat_idProducto = req.body.cat_id;


        // replace product info
        database.table('productos').filter({id: productId}).update({
            nombre: nombreProducto !== null ? nombreProducto : productos.nombre,
            descripcion: descripcionProducto !== null ? descripcionProducto : productos.Descripcion,
           precio: precioProducto !== null ? precioProducto : productos.precio,
            stock: stockProducto !== null ? stockProducto : productos.stock,
            imagen: imagenProducto !== null ? imagenProducto : productos.imagen,
            talle: talleProducto !== null ? talleProducto : productos.talle,
            marca: marcaProducto !== null ? marcaProducto : productos.marca,
            cat_id: cat_idProducto !== null ? cat_idProducto : productos.cat_id
        }).then( result => res.json('product updated successfully')).catch(err => res.json(err));
    }
});



//delete product//////////


router.put('/delete/:productId', async  (req, res) =>{
    let productId = req.params.productId;

    let productos = await database.table('productos').filter({id: productId}).withFields(['esta_eliminado']).get();


    if(productos.esta_eliminado ==0){

        database.table('productos').filter({id: productId }).update({
            esta_eliminado : 1
        }).then( result => res.json('product deleted successfully')).catch(err => res.json(err));

    }
    if(productos.esta_eliminado ==1){
        database.table('productos').filter({id: productId }).update({
            esta_eliminado : 0
        }).then( result => res.json('product restored successfully')).catch(err => res.json(err));
    }







    
});










module.exports = router;
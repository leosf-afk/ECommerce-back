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
                on: `c.id = p.cat_id WHERE c.nombre LIKE '%${cat_title}%' AND p.esta_eliminado = 0 AND p.stock != 0 `
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


/////search one product  ///////////
router.get('/search/:product', (req, res) => {

    let prod = req.params.product;

    database.table('productos as p')
    .join([
        {
            table: "categorias as c",
            on: `c.id = p.cat_id WHERE p.nombre LIKE '%${prod}%' AND p.esta_eliminado = 0 AND p.stock != 0 `
        }
    ])
    .withFields(['p.nombre as nombre',
    'c.nombre as categoria',
        'p.precio',
        'p.stock',
        'p.descripcion',
        'p.imagen',
        'p.id'
    ])
    .getAll()
    .then(result => {
        if (result.length > 0) {
            res.json(result);
        } else {
            res.json({message: "No product found"});
        }

    }).catch(err => res.json(err));
   
});

// new product /////////

router.post('/new', async (req,res) =>{    

let {nombreProducto,descripcionProducto,precioProducto,stockProducto,imagenProducto,talleProducto,marcaProducto,cat_idProducto}= req.body;



let id_cat = await database.table('categorias').filter({id : cat_idProducto}).withFields(['id']).get();





let value;

try {
     value = id_cat.id;

    
} catch (err) {
    console.log('Error: ', err.message);

}


if (cat_idProducto != null && cat_idProducto == value){
                
    database.table('productos')
    .insert({
        cat_id: cat_idProducto,
        nombre: nombreProducto,
        descripcion: descripcionProducto,
        precio: precioProducto,
        stock: stockProducto,
        imagen: imagenProducto,
        talle: talleProducto,
        marca: marcaProducto

    }).then( result => {
        res.json({
            success: true
        })

    }
    )
        // res.json({message: `success`})
    
} else{
    res.json({message: `please select a category`});



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
        let {nombreProducto,descripcionProducto,precioProducto,stockProducto,imagenProducto,talleProducto,marcaProducto,cat_idProducto} = req.body;
        let categoryId;
        let idCat;
        try {

            idCat = await database.table('categorias').filter({id : cat_idProducto}).withFields(['id']).get();


           categoryId = Object.values(JSON.parse(JSON.stringify(idCat)))
        
           
        }catch (err) {
            console.log('Error: ', err.message);
        }



        // replace product info

        if (nombreProducto != null && nombreProducto != undefined) {

            database.table('productos').filter({id: productId}).update({
                nombre: nombreProducto
            })
        }
        else{

            database.table('productos').filter({id: productId}).update({
                nombre: product.nombre
        })
        }
        /////////////////////////
        if (descripcionProducto != null && descripcionProducto != undefined) {

            database.table('productos').filter({id: productId}).update({
                descripcion: descripcionProducto
            })
        }
        else{

            database.table('productos').filter({id: productId}).update({
                descripcion: product.descripcion
        })
        }
        //////////////////////////
        if (precioProducto != null && precioProducto != undefined) {

            database.table('productos').filter({id: productId}).update({
                precio: precioProducto
            })
        }
        else{

            database.table('productos').filter({id: productId}).update({
                precio: product.precio
        })
        }
        /////////////////////////
        if (stockProducto != null && stockProducto != undefined) {

            database.table('productos').filter({id: productId}).update({
                stock: stockProducto
            })
        }
        else{

            database.table('productos').filter({id: productId}).update({
                stock: product.stock
        })
        }
        ///////////////////////////////
        if (imagenProducto != null && imagenProducto != undefined) {

            database.table('productos').filter({id: productId}).update({
                imagen: imagenProducto
            })
        }
        else{

            database.table('productos').filter({id: productId}).update({
                imagen: product.imagen
        })
        }
        ////////////////////////////////
        if (talleProducto != null && talleProducto != undefined) {

            database.table('productos').filter({id: productId}).update({
                talle: talleProducto
            })
        }
        else{

            database.table('productos').filter({id: productId}).update({
                talle: product.talle
        })
        }
        //////////////////////////////
        if (marcaProducto != null && marcaProducto != undefined) {

            database.table('productos').filter({id: productId}).update({
                marca: marcaProducto
            })
        }
        else{

            database.table('productos').filter({id: productId}).update({
                marca: product.marca
        })
        }
        /////////////////////////////////

        if (categoryId != undefined) {

            if (cat_idProducto == categoryId && cat_idProducto != undefined &&  cat_idProducto != null ) {

                database.table('productos').filter({id: productId}).update({
                    cat_id: cat_idProducto
                }).then(
                    res.json({message: `success`})
                )
            }
            else{
    
                database.table('productos').filter({id: productId}).update({
                    cat_id: product.cat_id
            }).then(
                res.json({message: `success`})
            )
            }
            
        }
        else{
    
            database.table('productos').filter({id: productId}).update({
                cat_id: product.cat_id
        }).then(
            res.json({message: `success`})
        )
        }

    }
});



//delete product//////////

router.put('/delete/:productId', async  (req, res) =>{
    let productId = req.params.productId;

    let productos = await database.table('productos').filter({id: productId}).withFields(['esta_eliminado']).get();

    if(productos.esta_eliminado ==0){

        database.table('productos').filter({id: productId }).update({
            esta_eliminado : 1
        }).then( result => res.json('product has been deleted successfully')).catch(err => res.json(err));

    }
    if(productos.esta_eliminado ==1){
        database.table('productos').filter({id: productId }).update({
            esta_eliminado : 0
        }).then( result => res.json('product has been restored successfully')).catch(err => res.json(err));
    }

});




module.exports = router;
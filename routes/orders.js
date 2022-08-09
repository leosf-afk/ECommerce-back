const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');
const crypto = require('crypto')
const transporter = require('../config/mailer.ts');
const { Console } = require('console');

router.post('/new', async (req, res) => {
    let {userId, products} = req.body;
    console.log(userId);
    console.log(products);
    

     if (userId !== null && userId > 0) {
        database.table('pedidos')
            .insert({
               usuario_id: userId,
               fecha: new Date()
            }).then((newOrderId) => {

            if (newOrderId.insertId > 0) {
                products.forEach(async (p) => {

                        let data = await database.table('productos').filter({id: p.id}).withFields(['stock']).get();


                    let inCart = parseInt(p.incart);
                    
                    // Deduct the number of pieces ordered from the quantity in database

                    if (data.stock > 0) {
                        data.stock = data.stock - inCart;

                        if (data.stock < 0) {
                            data.stock = 0;
                        }

                    } else {
                        data.stock = 0;
                    }

                    // Insert order details w.r.t the newly created order Id
                    database.table('pedidos_detalles')
                        .insert({
                            pedido_id: newOrderId.insertId,
                            producto_id: p.id,
                            cantidad: inCart
                        }).then(newId => {
                        database.table('productos')
                            .filter({id: p.id})
                            .update({
                                stock : data.stock
                            }).then(successNum => {
                        }).catch(err => console.log(err));
                    }).catch(err => console.log(err));
                });
            } else {
                res.json({message: 'New order failed while adding order details', success: false});
            }
            res.json({
                message: `Order successfully placed with order id ${newOrderId.insertId}`,
                success: true,
                pedido_id: newOrderId.insertId,
                productos: products,
            })
        }).catch(err => res.json(err));
    }

    else {
        res.json({message: 'New order failed', success: false});
    }
});





//cancel order///////////////

router.put('/cancel/:pedidoid', async  (req, res) =>{
    let pedidoId = req.params.pedidoid;

    let PedidoDetalle = await database.table('pedidos_detalles').filter({pedido_id: pedidoId}).withFields(['producto_id', 'cantidad']).getAll();

    let pedido = await database.table('pedidos').filter({id: pedidoId}).withFields(['cancelado']).get();


    if(pedido.cancelado == 0){

        database.table("pedidos").filter({id:pedidoId}).update({
            cancelado : 1
        }).then((updatedOrder) => {


            if (updatedOrder) {

                 PedidoDetalle.forEach(async (x) =>{
    
    
            let prods = await database.table('productos').filter({id: x.producto_id}).withFields(['stock']).get();


            database.table('productos')
            .filter({id: x.producto_id})
            .update({
                stock:  (x.cantidad + prods.stock)
            })
        })
            }else{
                res.json('error updating stock');
            }
            res.json({
                message: `order canceled successfully`,
                success: true
            })
            
        }).catch(err => res.json(err));
    }
    else{
        res.json('error, order deleted yet')
    }
        // PedidoDetalle.forEach(async (x) =>{
    
    
        //     let prods = await database.table('productos').filter({id: x.producto_id}).withFields(['stock']).get();


        // database.table('pedidos').filter({id: pedidoId}).update({
        //      cancelado : 1
        // }).then(orderId => {
        //     database.table('productos')
        //     .filter({id: x.producto_id})
        //     .update({
        //         stock:  (x.cantidad + prods.stock)
        //     })
        // });

        // })
        

    
    
});


// GET ALL ORDERS //////////////
router.get('/', (req, res) => {
    database.table('pedidos_detalles as pd')
        .join([
            {
                table: 'pedidos as pe',
                on: 'pe.id = pd.pedido_id'
            },
            {
                table: 'productos as p',
                on: 'p.id = pd.producto_id'
            },
            {
                table: 'usuarios as u',
                on: 'u.id = pe.usuario_id'
            }
        ])
        .withFields(['p.id', 'p.nombre', 'p.descripcion', 'p.precio', 'pd.cantidad', 'pe.fecha', 'u.usuario'])
        .getAll()
        .then(orders => {
            if (orders.length > 0) {
                res.json(orders);
            } else {
                res.json({message: "No orders found"});
            }

        }).catch(err => res.json(err));
});


//get all orders from one user

router.get('/user/:username', (req, res) => {

    let user = req.params.username;


    database.table('pedidos_detalles as pd')
        .join([
            {
                table: 'pedidos as pe',
                on: 'pe.id = pd.pedido_id'
            },
            {
                table: 'productos as p',
                on: 'p.id = pd.producto_id'
            },
            {
                table: 'usuarios as u',
                on: `u.id = pe.usuario_id WHERE u.usuario LIKE '%${user}%'`
            }
        ])
        .withFields(['p.id', 'p.nombre', 'p.descripcion', 'p.precio', 'pd.cantidad', 'pe.fecha', 'u.usuario'])
        .getAll()
        .then(orders => {
            if (orders.length > 0) {
                res.json(orders);
            } else {
                res.json({message: "No orders found"});
            }

        }).catch(err => res.json(err));
});



//get the last order from one user//////


router.get('/userLast/:userId', async (req, res) => {

    let user = req.params.userId;
    let prove = await database.table('pedidos').withFields(['id']).filter({usuario_id: user }).sort({id: -1}).get();
    let idOrder;

    try {
         idOrder = prove.id;
    } catch (err) {
        console.log('Error: ', err.message);
    }


    let messageUser;
   
  //console.log(idOrder);

   
     let ejemplito = await   database.table('pedidos_detalles as pd')
        .join([
            {
                table: 'pedidos as pe',
                on: 'pe.id = pd.pedido_id'
            },
            {
                table: 'productos as p',
                on: 'p.id = pd.producto_id'
            },
            {
                table: 'usuarios as u',
                on: `u.id = pe.usuario_id WHERE u.id LIKE '%${user}%' AND pe.id LIKE '%${idOrder}%'`
            }
        ])
        .withFields(['pe.id as orderId', 'p.id', 'p.nombre', 'p.descripcion', 'p.precio', 'pd.cantidad', 'pe.fecha', 'u.usuario'])
        .getAll()


        if (ejemplito != undefined && ejemplito != null) {
            let valor = 0;

            let prods = [];


            ejemplito.forEach(async (e) =>{

                 valor = valor + e.precio;

                 for (let i =0; i < e.orderId; i++) {

                    prods[i] += e.nombre;

                    prods[i] += ",";
                    
                 }

                 console.log(e.cantidad);

            })
            messageUser = await transporter.sendMail({
                                            from: '"api_eccomerce👻" <xxrastaxx865@gmail.com>', // sender address
                                            to: "xxrastaxx55@gmail.com", // list of receivers
                                            subject: "Nuevo pedido", // Subject line
                                            html: `<b> el usuario ${ejemplito[0].usuario} , pidio ${prods} por un valor total de ${valor}
                                            , la fecha ${ejemplito[0].fecha} </b>`, // html body
                                        });
            res.json({
                message: `email sended successfuly`,
                success: true
            })





            console.log(ejemplito[0].usuario);
            console.log(prods);
            console.log(valor);
            console.log(ejemplito[0].fecha);









                        //     res.json(ejemplito);

                        //   // ejemplito=JSON.parse(JSON.stringify(ejemplito));
            
                        //     console.log(ejemplito[0].orderId);
                        //     // console.log(ejemplito[0].id);
                        //     // console.log(ejemplito[0].nombre);
                        //     // console.log(ejemplito[0].descripcion);
                        //     // console.log(ejemplito[0].precio);
                        //     // console.log(ejemplito[0].cantidad);
                        //     // console.log(ejemplito[0].fecha);
                        //     // console.log(ejemplito[0].usuario);

                        //  //   console.log(ejemplito[1].nombre);
                        //     if (ejemplito[2] != undefined ) {
                        //         console.log('tres productos')
                                
                        //          messageUser = await transporter.sendMail({
                        //                             from: '"api_eccomerce👻" <xxrastaxx865@gmail.com>', // sender address
                        //                             to: "xxrastaxx55@gmail.com", // list of receivers
                        //                             subject: "Nuevo pedido", // Subject line
                        //                             html: `<b> el usuario ${ejemplito[0].usuario} , pidio ${ejemplito[0].nombre} (${ejemplito[0].cantidad}), ${ejemplito[1].nombre} (${ejemplito[1].cantidad}), ${ejemplito[2].nombre} (${ejemplito[2].cantidad})
                        //                             , la fecha ${ejemplito[0].fecha} </b>`, // html body
                        //                         });
                                
                        //     }
                        //     else if(ejemplito[1] != undefined) {
                        //         console.log('dos productos')
                                
                        //     }
                        //     else{
                        //         console.log('un productos')

                        //     }
        }
        else{
            res.json({message: "No orders found"});
        }


        
});


module.exports = router;
const express = require('express');
const router = express.Router();
const {database} = require('../config/helpers');
const crypto = require('crypto')

router.post('/new', async (req, res) => {
    let {userId, products} = req.body;
    console.log(userId);
    console.log(products);
    

     if (userId !== null && userId > 0) {
        database.table('pedidos')
            .insert({
               usuario_id: userId
            }).then((newOrderId) => {

            if (newOrderId.insertId > 0) {
                products.forEach(async (p) => {

                        let data = await database.table('productos').filter({id: p.id}).withFields(['stock']).get();


                    let inCart = parseInt(p.incart);
                    const id = newOrderId.insertId;

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
                            cantidad: inCart,
                            fecha: new Date()
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

router.put('/cancel/:pedido_detalleId', async  (req, res) =>{
    let pedidoDetalleId = req.params.pedido_detalleId;

    let PedidoDetalle = await database.table('pedidos_detalles').filter({id: pedidoDetalleId}).withFields(['cancelado', 'producto_id', 'cantidad']).get();



    if(PedidoDetalle.cancelado == 0 || PedidoDetalle.cancelado == null ){

        let prods = await database.table('productos').filter({id: PedidoDetalle.producto_id}).withFields(['stock']).get();

        database.table('pedidos_detalles').filter({id: pedidoDetalleId }).update({
             cancelado : 1
        }).then(orderId => {
            database.table('productos')
            .filter({id: PedidoDetalle.producto_id})
            .update({
                stock:  (PedidoDetalle.cantidad + prods.stock)
            }).then( result => res.json('order canceled successfully')).catch(err => res.json(err));
        });

    }
    else{
        res.json('error deleting order');
        
    }
    
    
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
        .withFields(['p.id', 'p.nombre', 'p.descripcion', 'p.precio', 'pd.cantidad', 'pd.fecha', 'u.usuario'])
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
        .withFields(['p.id', 'p.nombre', 'p.descripcion', 'p.precio', 'pd.cantidad', 'pd.fecha', 'u.usuario'])
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


router.get('/userLast/:username', async (req, res) => {

    let user = req.params.username;
    let prove = await database.table('pedidos').withFields(['id']).filter({usuario_id: user }).sort({id: -1}).get();

    let idOrder = prove.id;
   
  console.log(idOrder);

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
                on: `u.id = pe.usuario_id WHERE u.id LIKE '%${user}%' AND pe.id LIKE '%${idOrder}%'`
            }
        ])
        .withFields(['pe.id as orderId', 'p.id', 'p.nombre', 'p.descripcion', 'p.precio', 'pd.cantidad', 'pd.fecha', 'u.usuario'])
        .getAll()
        .then(orders => {
            if (orders.length > 0) {
                res.json(orders);
            } else {
                res.json({message: "No orders found"});
            }

        }).catch(err => res.json(err));
});







module.exports = router;
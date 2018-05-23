//
//	CREANDO TOKEN
//

var jwt = require('jsonwebtoken')
 
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json({limit:'10mb'}))
 
app.get('/loginConToken', (req, res) => {
  var username = req.body.user
  var password = req.body.password
 
  if( !(username === 'oscar' && password === '1234')){
    res.status(401).send({
      error: 'usuario o contraseña inválidos'
    })
    return
  }
 
  var tokenData = {
    username: username
    // ANY DATA
  }
 
  var token = jwt.sign(tokenData, 'Secret Password', {
     expiresIn: 60 * 60 * 24 // expires in 24 hours
  })
 
  res.send({
    token
  })
})

//
//
// VALIDANDO USANDO TOKEN

app.get('/secure', (req, res) => {
    var token = req.headers['authorization']
    if(!token){
        res.status(401).send({
          error: "Es necesario el token de autenticación"
        })
        return
    }
 
    token = token.replace('Bearer ', '')
 
    jwt.verify(token, 'Secret Password', function(err, user) {
      if (err) {
        res.status(401).send({
          error: 'Token inválido'
        })
      } else {
        res.send({
          message: 'Awwwww yeah!!!!'
        })
      }
    })
})
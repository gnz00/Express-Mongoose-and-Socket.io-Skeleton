const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PlayerEvent = require('../../models/PlayerEvent');

/* POST /api/playerEvents */
router.post('/', function(req, res, next) {

  // We can access socketio and emit events
  var socket = req.app.get('socketio');
  socket.emit('new PlayerEvent', req.body);

  // Create a new event
  var event = new PlayerEvent({
    data: req.body
  });

  // Persist the player event
  event.save(function (err) {
    if (err) {
      // Add handler for error here
      return;
    }

    // Saved!
    res.sendStatus(200);
  })
});

module.exports = router;

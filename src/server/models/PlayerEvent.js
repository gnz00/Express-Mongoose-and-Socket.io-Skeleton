import Mongoose from 'mongoose';

// Create Mongoose Model
const PlayerEvent = Mongoose.model('PlayerEvent',
  new Mongoose.Schema({
    data: {}
  })
);

export default PlayerEvent;
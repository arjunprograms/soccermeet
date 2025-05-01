 
module.exports = (req, res) => {
    res.status(200).json({
      message: 'SoccerMeet API is working!',
      timestamp: new Date().toISOString()
    });
  };
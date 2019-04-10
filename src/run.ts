import main = require('./main');

main.test()
    .then(() => { console.log("Done"); })
    .catch((err) => { console.log("Error", err); })

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error Interno del Servidor';

    res.status(statusCode).json({
        error: true,
        message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
};

module.exports = errorHandler;

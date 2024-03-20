
const jwt = require('jsonwebtoken');

function jwtMiddleware() {
  return async (ctx, next) => {
    const tokenWithPrefix = ctx.headers.authorization;
    if (tokenWithPrefix && tokenWithPrefix.startsWith('Bearer ')) {
      const token = tokenWithPrefix.substring(7);
      console.log('토큰:', token);
      try {
        const decoded = jwt.verify(token, 'bHdrZWpmb3dpZWZub3FpaDIzNDUyMzQ1ZWZvcWllZmhvZXdmd2tqZWYyMzQxM2Jub3F1ZWZicW9ldWZicW9laWZ1YjQxMzV3b2lldWZid29lZmI=');
        console.log("decoded: ", decoded);
        ctx.state.user = decoded.sub;
      } catch (error) {
        console.error('토큰 검증 에러:', error);
      }
    }
    await next();
  };
}

module.exports = jwtMiddleware;
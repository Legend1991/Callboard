/**
 * Main class
 */
export default class Base {
  /**
   * Call methods by name
   * @param name
   */
  callOn(name) {
    return async (req, res, next) => {
      try {
        let result = await this[name](req, res, next);
        res.status(200).send(result);
      } catch (err) {
        next(err);
      }
    }
  }

  /**
   * Check that n is number
   * @param n
   * @returns {boolean}
   * @private
   */
  _isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
}

/**
 * Run controller
 */
export let run = (Target) => {
  return new Target();
};
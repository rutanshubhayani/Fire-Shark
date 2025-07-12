/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test API endpoint
 *     description: Simple test endpoint to verify API is working
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: API is working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "StackIt API is working!"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
function handleTest(req, res) {
  return res.status(200).json({
    status: 200,
    message: 'StackIt API is working!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

module.exports = handleTest;

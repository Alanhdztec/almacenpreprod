// ========================================
// 6. CONTROLLERS/HOMECONTROLLER.JS
// ========================================

class HomeController {
  static showDashboard(req, res) {
    const user = req.session.user;
    
    res.render('dashboard', {
      title: 'Dashboard - Sistema de Almacén',
      user: user
    });
  }
}

module.exports = HomeController;
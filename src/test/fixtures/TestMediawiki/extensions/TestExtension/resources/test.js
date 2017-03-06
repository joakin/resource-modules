mw.template = { get: function () {} }
mw.msg = function () {}

// Template with a string literal
mw.template.get( 'module1', 'template' )
// Template usage with non-string literals
mw.template.get( someRandomVariable, anotherRandomVariable )

// Message properly declared
mw.msg( 'message0' )
// mw.msg usage with non-string literals
mw.msg( someRandomVariable )
// Message not declared on ResourceModules
mw.msg( 'message1' )

mw.mobileFrontend.require('mf-define-in-module-previous-script')
mw.mobileFrontend.require('mf-define-in-dependency-module')

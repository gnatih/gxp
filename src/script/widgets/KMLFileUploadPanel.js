/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = gxp
 *  class = KMLFileUploadPanel
 *  base_link = `Ext.FormPanel <http://extjs.com/deploy/dev/docs/?class=Ext.FormPanel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class:: KMLFileUploadPanel(config)
 *   
 *      A panel for uploading a new KML file.
 */
gxp.KMLFileUploadPanel = Ext.extend(Ext.FormPanel, {
    
    /** i18n */
    fileLabel: "KML file",
    fieldEmptyText: "Browse for KML files...",
    uploadText: "Upload",
    waitMsgText: "Uploading your data...",
    invalidFileExtensionText: "File extension must be one of: ",
    resetText: "Reset",
    failedUploadingTitle: "Cannot upload file",
    /** end i18n */

    
    /** private: property[fileUpload]
     *  ``Boolean``
     */
    fileUpload: true,

	width: 500,
	frame: true,
    autoHeight: true,
	bodyStyle: 'padding: 10px 10px 0 10px;',
	labelWidth: 50,
	defaults: {
	     anchor: '95%',
	     allowBlank: false,
	     msgTarget: 'side'
	},

    
    /** api: config[validFileExtensions]
     *  ``Array``
     *  List of valid file extensions.  These will be used in validating the 
     *  file input value.  Default is ``[".kml"]``.
     */
    validFileExtensions: [".kml"],
    
    /** api: config[url]
     *  ``String``
     *  URL for upload service.
     */
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        // Allow for a custom method to handle upload responses.
        /*config.errorReader = {
            read: config.handleUploadResponse || this.handleUploadResponse.createDelegate(this)
        };*/
        gxp.KMLFileUploadPanel.superclass.constructor.call(this, config);
    },
    
    /** private: method[initComponent]
     */
    initComponent: function() {
        
        this.items = [{
            xtype: "fileuploadfield",
            id: "file",
            emptyText: this.fieldEmptyText,
            fieldLabel: this.fileLabel,
            name: "file",
            buttonText: "",
            buttonCfg: {
                iconCls: "gxp-icon-filebrowse"
            },
            listeners: {
                "fileselected": function(cmp, value) {
                    // remove the path from the filename - avoids C:/fakepath etc.
                    cmp.setValue(value.split(/[/\\]/).pop());
                }
            },
            validator: this.fileNameValidator.createDelegate(this)
        }
        ];
        
        this.buttons = [{
            text: this.uploadText,
            handler: function() {
				var map = this.map;
                var form = this.getForm();
                if (form.isValid()) {
                    form.submit({
                        url: 'http://localhost:8080/FileUploader/FileUploader', 
                        submitEmptyText: false,
                        waitMsg: this.waitMsgText,
                        waitMsgTarget: true,
                        reset: true,
                        scope: this,
						failure: function(form, action){
							console.error(action);
							 Ext.Msg.show({
                               title: this.failedUploadingTitle,
                               msg: action.responseText,
                               buttons: Ext.Msg.OK,
                               icon: Ext.MessageBox.ERROR
                            });
						},
						success:this.handleUploadSuccess
                    });
                }
            },
            scope: this
        },{
			text: this.resetText,
			scope: this,
			handler: function(){
				this.getForm().reset();
			}
		  }
	   ];
        
        this.addEvents(

            /**
             * Event: uploadcomplete
             * Fires upon successful upload.
             *
             * Listener arguments:
             * panel - {<gxp.LayerUploadPanel} This form panel.
             * details - {Object} An object with "name" and "href" properties
             *     corresponding to the uploaded layer name and resource href.
             */
            "uploadcomplete"
        ); 

        gxp.KMLFileUploadPanel.superclass.initComponent.call(this);

    },
    
    /** private: method[fileNameValidator]
     *  :arg name: ``String`` The chosen filename.
     *  :returns: ``Boolean | String``  True if valid, message otherwise.
     */
    fileNameValidator: function(name) {
        var valid = false;
        var ext, len = name.length;
        for (var i=0, ii=this.validFileExtensions.length; i<ii; ++i) {
            ext = this.validFileExtensions[i];
            if (name.slice(-ext.length).toLowerCase() === ext) {
                valid = true;
                break;
            }
        }
        return valid || this.invalidFileExtensionText + '<br/>' + this.validFileExtensions.join(", ");
    },

    /** private: method[getUploadUrl]
     */
    getUploadUrl: function() {
        return this.url + "/upload";
    },
     
    /** private: method[handleUploadSuccess]
     */
    handleUploadSuccess: function(form, action) {
        var obj = Ext.decode( action.response.responseText );
        this.fireEvent("uploadcomplete", this, obj.result);
    }

});

/** api: xtype = gxp_kmlfileuploadpanel */
Ext.reg("gxp_kmlfileuploadpanel", gxp.KMLFileUploadPanel);

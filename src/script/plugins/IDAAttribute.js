
/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = IDAAttribute
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: IDAAttribute(config)
 *
 */   
gxp.plugins.IDAAttribute = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_idaattribute */
    ptype: "gxp_idaattribute",
    
    id: null,

    title: "Layer Attribute",
    
    settingsTitle: "Base Settings",
    rasterAlgebraExecuteMessage: "Raster Algebra run request sent.",
    settingNameTitle: "Name",
    settingColorTitle: "Color",
    settingClassificationTitle: "Classification",
    filterApplyTitle: "Filter Apply",
    filterApplyMsg: "Your filter is empty or not properly formatted!",
    filterTitle: "Filter",
    advancedFilterTitle: "Advanced Filter",
    reloadLayerText: "Reload Layers",
    applyFilterText: "Run",
    resetText: "Reset",
        
    settingColor: '000000',
    
    wpsManager: null,
    
    wfsGrid: null,
    
    wpsProcess: "gs:IDARasterAlgebra",
	
	store:[
		'ALL',
		'UNCLASSIFIED',
		'RESTRICTED',
		'CONFIDENTIAL',
		'SECRET',
		'TOPSECRET'						
	],
    
    layerNamePrefix: "AttributeMatch",
    
    /** api: config[colorStyles]
    *  ``Array String``
    *  
    */
    colorStyles: null,
    
    defaultBuilder: {
        // The attributes conrespont to the IDA raste layers (SPM + Habitat)
        // TODO - If/When  possible make it as remote (store/reader) 
        baseURL: "http://localhost:8080/",
        //proxy: "/proxy/?url=",
        allowBlank: true,
        allowGroups: true
    },
    
    attributeField: null,
    
    /**
     *  Spatial filter boundaries, in decimal values 
     */
    spatialFilterOptions: {
            lonMax: 90,
            lonMin: -90,
            latMax: 180,
            latMin: -180
    },
    
    /**
     * i18n for the Spatial filter
     */
    northLabel:"North",
    westLabel:"West",
    eastLabel:"East",
    southLabel:"South",
    setAoiText: "SetROI",
    setAoiTooltip: "Enable the SetBox control to draw a ROI (BBOX) on the map",
    queryByLocationText: "Region Of Interest",

	/**
     * Property: selectStyle
     * {Object} Configuration of OpenLayer.Style. 
     *    used to highlight the BBOX
     *     
     */
    selectStyle:{
        fillColor: "#FF0000",
        strokeColor: "#FF0000",
        fillOpacity:0,
        strokeWidth:2,
        strokeOpacity:1
    },
    
    /** private: method[constructor]
     *  :arg config: ``Object``
     */
    constructor: function(config) {
        gxp.plugins.IDAAttribute.superclass.constructor.apply(this, arguments);
    },
    
    /** private: method[addOutput]
     *  :arg config: ``Object``
     */
    addOutput: function(config) {
        Ext.form.Field.prototype.msgTarget = 'side';
        Ext.ux.form.FieldPanel.prototype.msgTarget = 'side';
        
        //
        // Fix for ExtJs 3 version
        //
        /*Ext.override(Ext.Element, {
        	getColor: function(attr, defaultValue, prefix){
        		var v = this.getStyle(attr), color = typeof prefix == "undefined" ? "#" : prefix, h;
        		if (!v || /transparent|inherit/.test(v)) {
        			return defaultValue;
        		}
        		if (/^r/.test(v)) {
        			Ext.each(v.slice(4, v.length - 1).split(','), function(s){
        				h = parseInt(s, 10);
        				color += (h < 16 ? '0' : '') + h.toString(16);
        			});
        		} else {
        			v = v.replace('#', '');
        			color += v.length == 3 ? v.replace(/^(\w)(\w)(\w)$/, '$1$1$2$2$3$3') : v;
        		}
        		return (color.length > 5 ? color.toLowerCase() : defaultValue);
        	}
        });*/
        
        var now = new Date();
        this.attributeField= new Ext.form.TextField({
            xtype: 'textfield',
            fieldLabel: this.settingNameTitle,
            readOnly: true,
            width: 200,
            name: this.settingNameTitle,
            value: this.layerNamePrefix + "_" +now.format("Y_m_d_H_i_s")
        });
        
        var settings = new Ext.form.FieldSet({
                title: this.settingsTitle,
                autoHeight: true,
                labelWidth: 80,
                items: [
                    this.attributeField,
                    {
                        xtype: 'combo',
                        allowBlank: false,
                        editable: false,
                        triggerAction: "all",
                        resizable: true,
                        fieldLabel: this.settingColorTitle,
                        width: 200,
                        name: this.settingColorTitle,
                        store: this.colorStyles,
                        value: this.colorStyles[0]
                    }, {
                        xtype: 'combo',
                        allowBlank: false,
                        editable: false,
                        triggerAction: "all",
                        resizable: true,
                        fieldLabel: this.settingClassificationTitle,
                        width: 200,
                        name: this.settingClassificationTitle,
                        store: this.store,
                        value: 'ALL'
                    }
                ]
        });
		settings.getMetadata = function(){
			var meta = {};
			meta.name = this.items.get(0).getValue();
			meta.color = this.items.get(1).getValue();
			meta.classify = this.items.get(2).getValue();
			return meta;
		};
		
		// Spatial Filter
		
		var spatialFilterFieldset= {
                xtype: "fieldset",
                ref: "spatialFieldset",
                title: this.queryByLocationText,
                autoHeight: true,
                checkboxToggle: false,
                items: [
                    {
                        xtype: "panel",
                        border: false,
                        header: false,
                        ref: "../aoiFieldset",
                        id: 'bboxAOI-set2',
                        autoHeight: true,
                        layout: 'table',
                        layoutConfig: {
                            columns: 3
                        },
                        defaults: {
                            // applied to each contained panel
                            bodyStyle:'padding:5px;'
                        },
                        bodyCssClass: 'aoi-fields',
                        checkboxToggle: true,
                        items: [
                            this.populateSpatialForm(this.target.mapPanel.map)
                        ]
                    }
                ]
        };
		
		////
		
		var params = this.defaultBuilder;
		params.proxy = this.target.proxy;
		
		if(this.target.riskData.urlParameters.geoserverURL)
			params.baseURL = this.target.riskData.urlParameters.geoserverURL;
		
		if(this.target.riskData.coveragesSettings)
			params.coveragesSettings = this.target.riskData.coveragesSettings;
                    
                if(this.target.riskData.defualtCoverageSetting)
			params.defualtCoverageSetting = this.target.riskData.defualtCoverageSetting;
                    
               if(this.target.riskData.spmCoverageSetting)
			params.spmCoverageSetting = this.target.riskData.spmCoverageSetting;
               
               if(this.target.riskData.layerAttributeCoverageSetting)
			params.layerAttributeCoverageSetting = this.target.riskData.layerAttributeCoverageSetting;
		
        var filterBuilder = new gxp.IDAFilterBuilder(params);
        var advancedFilterBuilder = new gxp.IDAAdvancedFilterBuilder(params);
		
		
		var filter = new Ext.form.FieldSet({
			title: this.filterTitle,
			autoHeight: true,
			maxNumberOfGroups: 2,
			layout:'fit',
			autoScroll:true,
			checkboxToggle: true,
			items: [
				filterBuilder
			],
            listeners:{
                "beforeexpand":function(){
                    advancedFilter.collapse();
                }
            }
		});

        var advancedFilter = new Ext.form.FieldSet({
            title: this.advancedFilterTitle,
            autoHeight: true,
            layout:'fit',
            autoScroll:true,
            checkboxToggle: true,
            items: [
                advancedFilterBuilder
            ]            
            ,
            listeners:{
                "beforeexpand":function(){
                    filter.collapse();
                },
                "afterlayout":{
                    fn: function(p){
                        p.disable();
                    },
                    single: true // important, as many layouts can occur
                },
                "render":function(cmp){
                    // mask while waiting
                    var mask = new Ext.LoadMask(cmp.getEl());
                    mask.show();
                    setTimeout(function(){
                        cmp.collapse();
                        mask.hide();
                        cmp.enable();
                    }, 1000);  // 1 second to render
                }
            }
            
        });

		
		var form = new Ext.form.FormPanel({
			border: false,
			width: 460,
			autoScroll:true,
			labelAlign: 'left',
			items: [
                settings,
                spatialFilterFieldset,
                filter,
                advancedFilter
            ]
		});
        
        var me=this;
        var cpanel = new Ext.Panel({
            border: false,
			autoScroll: true,
			bodyStyle: "padding: 5px",
            disabled: false,
            title: this.title,
			bbar: [
			    /*{
			     text: this.reloadLayerText,
			     iconCls: "icon-reload-layers",
			     handler: function(){
					    //
						// Find sub components by type and reload the combo store on the fly. 
						//
						var filterFields = filter.findByType("gxp_idafilterfield");
						for(var i=0; i<filterFields.length; i++){
							filterFields[i].items.get(0).store.reload();
						}
					}
				},*/
					'->',
				{
					text: this.applyFilterText,
					iconCls: "icon-attribute-apply",
					scope: this,
					handler: function(){

                        var validROI = (this.northField.isDirty() && this.southField.isDirty() && 
                              this.eastField.isDirty() && this.westField.isDirty());
					    
                        // This is the Basic filter
                        var f = filterBuilder.getFilter();

                        // This is the Advanced filter
                        // cannot access to advancedFilter from inside the getFilter() function
					    var af = (advancedFilter.collapsed) ? false : advancedFilterBuilder.getFilter();
					    
					                             
                        if((af || f) && validROI){
                            var infoRun= {};
                            var now= new Date();
                            me.attributeField.setValue(me.layerNamePrefix + "_" + now.format("Y_m_d_H_i_s"));
                            var wfsGrid= me.target.tools[this.wfsGrid];
                            infoRun.inputs={};
                            infoRun.inputs=settings.getMetadata();
                            if(af){
    					        // at this point af should be an array

    					        // set infoRun.inputs.inputs
    					        infoRun.inputs.inputs = af;

                                // set infoRun.inputs.script
                                infoRun.inputs.script = advancedFilterBuilder.getComponent('script').getValue();
    					        
    					    }else{
    					        
                                var filterFormat = new OpenLayers.Format.CQL();
                                var filterCQL = filterFormat.write(f);  
                                                            
                                infoRun.inputs.attributeFilter= filterCQL;
    					        
    					    }
                            
                            infoRun.inputs.AOI = new OpenLayers.Bounds(
                                                                this.westField.getValue(), 
                                                                this.southField.getValue(), 
                                                                this.eastField.getValue(), 
                                                                this.northField.getValue()
                                                             );
                            
                            var wps = me.target.tools[me.wpsManager];
                                                        
                            var runProcess= me.getRARun(infoRun);
                            now= new Date();
                            me.attributeField.setValue(me.layerNamePrefix + "_" + now.format("Y_m_d_H_i_s"));
                                                        
                            wps.execute(me.wpsProcess,runProcess,function(response){
                                wfsGrid.refresh();
                                var fc = OpenLayers.Format.XML.prototype.read.apply(this, [response]);
                                var fid = fc.getElementsByTagName("gml:ftUUID")[0];  
                                if(!fid){
                                    var wpsError=new OpenLayers.Format.WPSExecute().read(response);
                                    if(wpsError && wpsError.executeResponse && wpsError.executeResponse.status){
                                          var ex=wpsError.executeResponse.status.exception.exceptionReport.exceptions[0];
                                          if(ex)
                                               Ext.Msg.show({
                                                   title:"Layer Attribute: " + ex.code,
                                                   msg: ex.texts[0] ,
                                                   buttons: Ext.Msg.OK,
                                                   icon: Ext.MessageBox.ERROR
                                               });
                                     }
                                 }    
                                 wfsGrid.refresh();         
                            });
							wfsGrid.refresh();
							
							me.activateRasterAlgebraList(true);
                                                        
						}else{
							Ext.Msg.show({
								title: me.filterApplyTitle,
								msg: me.filterApplyMsg,
								buttons: Ext.Msg.OK,
								icon: Ext.Msg.INFO
							});
						}
					}
				},{
					text: this.resetText,
					iconCls: "icon-attribute-reset",
					scope: this,
					handler: function(){
					    filterBuilder.cleanFilter();
						filter.removeAll();
						
						filterBuilder = new gxp.IDAFilterBuilder(this.defaultBuilder);
						
						filter.add(filterBuilder);
						filter.doLayout();
						
						form.getForm().reset();
						filter.maxNumberOfGroups=2;
						
					}
				}
			],
			items:[form]
        });
		
        config = Ext.apply(cpanel, config || {});
        
        var attributePanel = gxp.plugins.IDAAttribute.superclass.addOutput.call(this, config);

        //Ext.getCmp("idacontrol").setActiveTab(cpanel);
        
        return attributePanel;
    },
    /*
     * Get RasterAlgebra Run
     * sets the input/outputs of the Wps process to be called
     */
    getRARun: function(infoRun){
            var inputs= infoRun.inputs;

            var reqInputs = {
                    areaOfInterest: new OpenLayers.WPSProcess.ComplexData({
                        value: inputs.AOI.toGeometry().toString(),
                        mimeType: "application/wkt"
                    }),
                    attributeName: new OpenLayers.WPSProcess.LiteralData({
                        value:inputs['name']
                    }),
                    wsName: new OpenLayers.WPSProcess.LiteralData({
                        value:inputs.wsName || rasterAlgebra.wsName
                    }),
                    storeName: new OpenLayers.WPSProcess.LiteralData({
                        value:rasterAlgebra.storeName
                    }),
                    outputUrl: new OpenLayers.WPSProcess.LiteralData({
                        value:rasterAlgebra.outputUrl
                    }),
                    classification: new OpenLayers.WPSProcess.LiteralData({
                        value:inputs['classify']
                    }),
                    styleName: new OpenLayers.WPSProcess.LiteralData({
                        value: inputs.styleName || "layerattribute_"+inputs['color'].toLowerCase()
                    })
                    /*attributeFilter: new OpenLayers.WPSProcess.ComplexData({
                            value: inputs['attributeFilter'],
                            mimeType: "text/plain; subtype=cql"
                    })
                    attributeFilter: new OpenLayers.WPSProcess.LiteralData({
                        value: inputs['attributeFilter']
                    })*/
            };
                
            // 'attributeFilter' and 'script' exclusiveness has been checked before calling this method
            if(inputs['attributeFilter']){
                reqInputs.attributeFilter = new OpenLayers.WPSProcess.LiteralData({
                        value: inputs['attributeFilter']
                });
            }
            
            // A script can have multiple inputs with the same name and different values
            if(inputs['script']){
                
                reqInputs.script = new OpenLayers.WPSProcess.LiteralData({
                        value: inputs['script']
                });
                reqInputs.inputs = new Array();
                var n = inputs['inputs'].length;
                for(var i = n-1; i>=0; i--)
                   reqInputs.inputs.push(
                       new OpenLayers.WPSProcess.LiteralData({
                            value: inputs['inputs'][i]
                           })
                   );
            }

            // Build the actual request object
            var requestObj = {
                type: "raw",
                inputs: reqInputs ,
                outputs: [{
                    identifier: "result",
                    mimeType: "text/xml; subtype=wfs-collection/1.0"
                }]
            };
            
            return requestObj;
    },
    
    activateRasterAlgebraList: function(tooltip){
            var wfsgrid = Ext.getCmp(this.wfsGrid);
            Ext.getCmp('south').expand(false);
            Ext.getCmp('idalaylist').setActiveTab(wfsgrid);
            
            if(tooltip)
                this.showMsgTooltip(this.rasterAlgebraExecuteMessage);
    },
    
    showMsgTooltip: function(msg){
            var title="Layer Attribute";
            var elTooltop= Ext.getCmp("east").getEl();  
            var t = new Ext.ToolTip({
                floating: {
                            shadow: false
                          },
                width: elTooltop.getWidth()-10,
                title: title,
                html: msg,
                hideDelay: 190000,
                closable: true
            });
            t.showAt([elTooltop.getX()+5, elTooltop.getBottom()-100]);
            t.el.slideIn('b');  
    },
    
    //// Here starts the Spatial filter code
    /** private: method[populateSpatialForm]
     *  :arg map: ``Object``
     *  Spatial filter
     */
    populateSpatialForm: function(map){
        this.northField = new Ext.form.NumberField({
              fieldLabel: this.northLabel,
              id: "NorthBBOX2",
              width: 100,
              minValue: this.spatialFilterOptions.lonMin,
              maxValue: this.spatialFilterOptions.lonMax,
              decimalPrecision: 5,
              allowDecimals: true,
              hideLabel : false                    
        });
        
        this.westField = new Ext.form.NumberField({
              fieldLabel: this.westLabel,
              id: "WestBBOX2",
              width: 100,
              minValue: this.spatialFilterOptions.latMin,
              maxValue: this.spatialFilterOptions.latMax,
              decimalPrecision: 5,
              allowDecimals: true,
              hideLabel : false                    
        });
        
        this.eastField = new Ext.form.NumberField({
              fieldLabel: this.eastLabel,
              id: "EastBBOX2",
              width: 100,
              minValue: this.spatialFilterOptions.latMin,
              maxValue: this.spatialFilterOptions.latMax,
              decimalPrecision: 5,
              allowDecimals: true,
              hideLabel : false                    
        });
              
        this.southField = new Ext.form.NumberField({
              fieldLabel: this.southLabel,
              id: "SouthBBOX2",
              width: 100,
              minValue: this.spatialFilterOptions.lonMin,
              maxValue: this.spatialFilterOptions.lonMax,
              decimalPrecision: 5,
              allowDecimals: true,
              hideLabel : false                    
        });
                  
        //
        // Geographical Filter Field Set
        //        
        var selectAOI = new OpenLayers.Control.SetBox({
            map: map,
            aoiStyle: new OpenLayers.StyleMap(this.selectStyle),
            onChangeAOI: function(){
                var aoiArray = this.currentAOI.split(',');
                
                document.getElementById('WestBBOX2').value = OpenLayers.Util.toFloat(aoiArray[0],8);
                document.getElementById('SouthBBOX2').value = OpenLayers.Util.toFloat(aoiArray[1],8);
                document.getElementById('EastBBOX2').value = OpenLayers.Util.toFloat(aoiArray[2],8);
                document.getElementById('NorthBBOX2').value = OpenLayers.Util.toFloat(aoiArray[3],8);
            } 
        }); 
        
        map.addControl(selectAOI);
        
        this.aoiButton = new Ext.Button({
              text: this.setAoiText,
              tooltip: this.setAoiTooltip,
              enableToggle: true,
              toggleGroup: this.toggleGroup,
              iconCls: 'aoi-button',
              height: 50,
              width: 50,
              listeners: {
                  scope: this, 
                  toggle: function(button, pressed) {
                     //
                     // Reset the previous control
                     //
                     var aoiLayer = map.getLayersByName("AOI")[0];
                    
                     if(aoiLayer)
                         map.removeLayer(aoiLayer);
                     
                     if(pressed){
                          
                          // Check if the fields are all rendered and modified
                          if(this.northField.isDirty() && this.southField.isDirty() && 
                              this.eastField.isDirty() && this.westField.isDirty()){
                              this.northField.reset();
                              this.southField.reset();
                              this.eastField.reset();
                              this.westField.reset();
                          }

                          //
                          // Activating the new control
                          //                          
                          selectAOI.activate();
                      }else{
                          selectAOI.deactivate();
                      }
                  }
              }
        });
              
        var items = [
            {
                layout: "form",
                cellCls: 'spatial-cell',
                labelAlign: "top",
                border: false,
                colspan: 3,
                items: [
                    this.northField
                ]
            },{
                layout: "form",
                cellCls: 'spatial-cell',
                labelAlign: "top",
                border: false,
                items: [
                    this.westField
                ]
            },{
                layout: "form",
                cellCls: 'spatial-cell',
                border: false,
                items: [
                    this.aoiButton
                ]                
            },{
                layout: "form",
                cellCls: 'spatial-cell',
                labelAlign: "top",
                border: false,
                items: [
                   this.eastField
                ]
            },{
                layout: "form",
                cellCls: 'spatial-cell',
                labelAlign: "top",
                border: false,
                colspan: 3,
                items: [
                    this.southField
                ]
            }
        ];
        
        return items;
    }        
    
    /////////// End of Spatial filter code
    
});

Ext.preg(gxp.plugins.IDAAttribute.prototype.ptype, gxp.plugins.IDAAttribute);

/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the BSD license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 * @include widgets/FilterBuilder.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = QueryForm
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: QueryForm(config)
 *
 *    Plugin for performing queries on feature layers
 *    TODO Replace this tool with something that is less like GeoEditor and
 *    more like filtering.
 */
gxp.plugins.QueryForm = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_queryform */
    ptype: "gxp_queryform",

    /** api: config[featureManager]
     *  ``String`` The id of the :class:`gxp.plugins.FeatureManager` to use
     *  with this tool.
     */
    featureManager: null,
    
    /** api: config[autoHide]
     *  ``Boolean`` Set to true if the output of this tool goes into an
     *  ``Ext.Window`` that should be hidden when the query result is
     *  available. Default is false.
     */
    autoHide: false,

    /** private: property[schema]
     *  ``GeoExt.data.AttributeStore``
     */
    schema: null,
    
    /** api: config[queryActionText]
     *  ``String``
     *  Text for query action (i18n).
     */
    queryActionText: "Query",
    
    /** api: config[cancelButtonText]
     *  ``String``
     *  Text for cancel button (i18n).
     */
    cancelButtonText: "Cancel",

    /** api: config[queryMenuText]
     *  ``String``
     *  Text for query menu item (i18n).
     */
    queryMenuText: "Query layer",

    /** api: config[queryActionTip]
     *  ``String``
     *  Text for query action tooltip (i18n).
     */
    queryActionTip: "Query the selected layer",

    /** api: config[queryByLocationText]
     *  ``String``
     *  Text for query by location (i18n).
     */
    queryByLocationText: "Region Of Interest",

    /** api: config[currentTextText]
     *  ``String``
     *  Text for query by current extent (i18n).
     */
    currentTextText: "Current extent",

    /** api: config[queryByAttributesText]
     *  ``String``
     *  Text for query by attributes (i18n).
     */
    queryByAttributesText: "Query by attributes",
    
    /** api: config[queryMsg]
     *  ``String``
     *  Text for query load mask (i18n).
     */
    queryMsg: "Querying...",
    
    /** api: config[noFeaturesTitle]
     *  ``String``
     *  Text for no features alert title (i18n)
     */
    noFeaturesTitle: "No Match",

    /** api: config[noFeaturesMsg]
     *  ``String``
     *  Text for no features alert message (i18n)
     */
    noFeaturesMessage: "Your query did not return any results.",

    /** api: config[actions]
     *  ``Object`` By default, this tool creates a "Query" action to trigger
     *  the output of this tool's form. Set to null if you want to include
     *  the form permanently in your layout.
     */
    
    /** api: config[outputAction]
     *  ``Number`` By default, the "Query" action will trigger this tool's
     *  form output. There is no need to change this unless you configure
     *  custom ``actions``.
     */
    outputAction: 0,
    
    // Begin i18n.
    title: "Search",
    northLabel:"North",
    westLabel:"West",
    eastLabel:"East",
    southLabel:"South",
    setAoiText: "SetROI",
    setAoiTooltip: "Enable the SetBox control to draw a ROI (BBOX) on the map",
    attributeEnablement: "Query by Attribute",
    attributeEnablementMsg: "Invalid search Type! To use this you have to select 'Feature' type and to select a vector layer before.",
    searchType: "Base Settings",
    typeLabel: "Type",
    featureLabel: "Max Features",
    // End i18n.
    
    spatialFilterOptions: {
            lonMax: 90,
            lonMin: -90,
            latMax: 180,
            latMin: -180
    },
    
    maxFeatures: 20,
        
    constructor: function(config) {
        gxp.plugins.QueryForm.superclass.constructor.apply(this, arguments);
    },

    /** api: method[addOutput]
     */
    addOutput: function(config) {
        var featureManager = this.target.tools[this.featureManager];
        featureManager.maxFeatures = 20;
        
        var map = this.target.mapPanel.map;
        map.enebaleMapEvent = true;
        
        config = Ext.apply({
            border: false,
            bodyStyle: "padding: 10px",
            layout: "form",
            autoScroll: true,
            items: [{
                xtype: "fieldset",
                ref: "typeFieldSet",
                title: this.searchType,
                items: [{
                    xtype: "combo",
                    store: [
                            "SPM",
                            "Feature"
                    ],
                    value: "SPM",
                    ref: "../type",
                    anchor: "50%",
                    fieldLabel: this.typeLabel,
                    name: this.typeLabel,
                    allowBlank: true,
                    emptyText: "Basic",
                    editable: false,
                    triggerAction: "all",
                    resizable: false,
                    listeners: {
                        select: function(combo, record, index){
                            var schema = featureManager.schema;
                            if(combo.getValue() == 'Feature' && schema){
                                queryForm.attributeFieldset.setDisabled(false);
                                queryForm.attributeFieldset.expand(true);
                                //queryForm.attributeFieldset.show();
                            }else{
                                queryForm.attributeFieldset.setDisabled(true);
                                queryForm.attributeFieldset.collapse(true);
                                //queryForm.attributeFieldset.hide();
                            }
                        }
                    }
                }, {
                    xtype: "numberfield",
                    ref: "../maxfeature",
                    anchor: "50%",
                    fieldLabel: this.featureLabel,
                    value: this.maxFeatures,
                    minValue: 5,
                    maxValue: 100,
                    allowDecimals: false
                    /*listeners: {
                        	beforechange: function(field, newValue, oldValue){
                        	    if(!field.isValid())
                                  return false;
                        	}
                    }*/
                }]
            },/*{
                xtype: "fieldset",
                ref: "spatialFieldset",
                title: this.queryByLocationText,
                checkboxToggle: true,
                items: [{
                    xtype: "textfield",
                    ref: "../extent",
                    anchor: "100%",
                    fieldLabel: this.currentTextText,
                    value: this.getFormattedMapExtent(),
                    readOnly: true
                }]
            },*/{
                xtype: "fieldset",
                ref: "spatialFieldset",
                title: this.queryByLocationText,
                id: 'bboxAOI-set',
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
                    this.populateSpatialForm(map)
                ]
            }, {
                xtype: "fieldset",
                ref: "attributeFieldset",
                disabled: true,
                hidden: false,
                title: this.queryByAttributesText,
                collapsed: true,
                checkboxToggle: true
            }],
            bbar: ["->", {
                text: this.cancelButtonText,
                ref: "cancel",
                iconCls: "cancel",
                scope: this,
                handler: function() {
                    var ownerCt = this.outputTarget ? queryForm.ownerCt :
                        queryForm.ownerCt.ownerCt;
                    if (ownerCt && ownerCt instanceof Ext.Window) {
                        ownerCt.hide();
                    } else {
                        //
                        // Cleaning the attribute form
                        //
                        addFilterBuilder(
                            featureManager, 
                            featureManager.layerRecord,
                            featureManager.schema
                        );
                    }
                    
                    //
                    // Reset the Query form
                    //
                    queryForm.type.reset();
                    queryForm.maxfeature.reset();
                    
                    //
                    // Removing the ROI 
                    //
                    this.aoiButton.toggle(false);
                    
                    //
                    // Cleaning the Feature grid
                    //
                    featureManager.featureStore.removeAll();
                    
                    if(queryForm.type.getValue() != 'Feature' || !featureManager.schema){
                        queryForm.attributeFieldset.setDisabled(true);
                        queryForm.attributeFieldset.collapse(true);
                    }
                }
            }, {
                text: this.queryActionText,
                ref: "../query",
                iconCls: "gxp-icon-find",
                disabled: false,
                scope: this,
                handler: function() {                
                    if(queryForm.type.getValue() == 'Feature'){                         
                         if(featureManager.schema){
                            var filters = [];
                            
                            if (queryForm.spatialFieldset.collapsed !== true) {
                                 var roi = new OpenLayers.Bounds(
                                    this.westField.getValue(), 
                                    this.southField.getValue(), 
                                    this.eastField.getValue(), 
                                    this.northField.getValue()
                                 );
                                 
                                 var bbox = roi;
                                 if(!bbox)
                                    bbox = this.target.mapPanel.map.getExtent();
                                    
                                 filters.push(new OpenLayers.Filter.Spatial({
                                    type: OpenLayers.Filter.Spatial.BBOX,
                                    property: featureManager.featureStore.geometryName,
                                    value: bbox
                                 }));
                            }
                            
                            if (queryForm.attributeFieldset.collapsed !== true) {
                                var attributeFilter = queryForm.filterBuilder.getFilter();
                                attributeFilter && filters.push(attributeFilter);
                            }
                            
                            var mf = null;
                            if(queryForm.maxfeature.isDirty() && queryForm.maxfeature.isValid()) 
                                mf = queryForm.maxfeature.getValue();
                            else
                                mf = this.maxFeatures;
                           
                            featureManager.loadFeatures(mf, filters.length > 1 ?
                                new OpenLayers.Filter.Logical({
                                    type: OpenLayers.Filter.Logical.AND,
                                    filters: filters
                                }) :
                                filters[0]
                            );
                        }else{
                            Ext.Msg.show({
                                title: "Features Search",
                                msg: "Feature schema is null !",
                                buttons: Ext.Msg.OK,
                                icon: Ext.Msg.INFO
                            });
                        }
                    }else{
                        Ext.Msg.show({
                            title: "SPM Search",
                            msg: "Not implemented yet!",
                            buttons: Ext.Msg.OK,
                            icon: Ext.Msg.INFO
                        });
                    }
                },
                scope: this
            }]
        }, config || {});
        
        var queryForm = gxp.plugins.QueryForm.superclass.addOutput.call(this, config);
        
        if (queryForm) {
            this.target.tools[this.featureManager].on("layerchange", function(mgr, rec, schema) {
                //queryForm.query.setDisabled(!schema);      
                if(queryForm.type.getValue() == 'Feature' && schema){
                    queryForm.attributeFieldset.setDisabled(!schema);
                    //queryForm.attributeFieldset.show();
                }else{
                    queryForm.attributeFieldset.setDisabled(true);
                    //queryForm.attributeFieldset.hide();
                }
            }, this);
        }
        
        var addFilterBuilder = function(mgr, rec, schema) {
            queryForm.attributeFieldset.removeAll();
            //queryForm.setDisabled(!schema);
            if (schema) {
                queryForm.attributeFieldset.add({
                    xtype: "gxp_filterbuilder",
                    ref: "../filterBuilder",
                    attributes: schema,
                    allowBlank: true,
                    allowGroups: false
                });
                queryForm.spatialFieldset.expand();
                queryForm.attributeFieldset.expand();
            } else {
                queryForm.attributeFieldset.rendered && queryForm.attributeFieldset.collapse();
                queryForm.spatialFieldset.rendered && queryForm.spatialFieldset.collapse();
            }
            queryForm.attributeFieldset.doLayout();
        };
        
        featureManager.on("layerchange", addFilterBuilder);
        addFilterBuilder(featureManager,
            featureManager.layerRecord, featureManager.schema
        );
        
        this.target.mapPanel.map.events.register("moveend", this, function() {
            var spatialField = queryForm.spatialFieldset;
            
            if(spatialField){
                var extentArray = this.target.mapPanel.map.getExtent().toArray();
                
                this.westField.setValue(extentArray[0]);
                this.southField.setValue(extentArray[1]);
                this.eastField.setValue(extentArray[2]);
                this.northField.setValue(extentArray[3]); 
            }
        });
        
        featureManager.on({
            "beforequery": function() {
                new Ext.LoadMask(queryForm.getEl(), {
                    store: featureManager.featureStore,
                    msg: this.queryMsg
                }).show();
            },
            "query": function(tool, store) {
                if (store) {
                    store.getCount() || Ext.Msg.show({
                        title: this.noFeaturesTitle,
                        msg: this.noFeaturesMessage,
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.INFO
                    });
                    if (this.autoHide) {
                        var ownerCt = this.outputTarget ? queryForm.ownerCt :
                            queryForm.ownerCt.ownerCt;
                        ownerCt instanceof Ext.Window && ownerCt.hide();
                    }
                }
            },
            scope: this
        });
        
       if(this.outputTarget)
            Ext.getCmp(this.outputTarget).setActiveTab(queryForm);
            
        return queryForm;
    },
    
    /*getFormattedMapExtent: function() {
        var extent = this.target.mapPanel.map.getExtent();
        return extent && extent.toArray().join(", ");
    },*/
    
    /** private: method[populateSpatialForm]
     *  :arg map: ``Object``
     */
    populateSpatialForm: function(map){
        this.northField = new Ext.form.NumberField({
              fieldLabel: this.northLabel,
              id: "NorthBBOX",
              width: 100,
              minValue: this.spatialFilterOptions.lonMin,
              maxValue: this.spatialFilterOptions.lonMax,
              decimalPrecision: 5,
              allowDecimals: true,
              hideLabel : false                    
        });
        
        this.westField = new Ext.form.NumberField({
              fieldLabel: this.westLabel,
              id: "WestBBOX",
              width: 100,
              minValue: this.spatialFilterOptions.latMin,
              maxValue: this.spatialFilterOptions.latMax,
              decimalPrecision: 5,
              allowDecimals: true,
              hideLabel : false                    
        });
        
        this.eastField = new Ext.form.NumberField({
              fieldLabel: this.eastLabel,
              id: "EastBBOX",
              width: 100,
              minValue: this.spatialFilterOptions.latMin,
              maxValue: this.spatialFilterOptions.latMax,
              decimalPrecision: 5,
              allowDecimals: true,
              hideLabel : false                    
        });
              
        this.southField = new Ext.form.NumberField({
              fieldLabel: this.southLabel,
              id: "SouthBBOX",
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
            onChangeAOI: function(){
                var aoiArray = this.currentAOI.split(',');
                
                document.getElementById('WestBBOX').value = aoiArray[0];
                document.getElementById('SouthBBOX').value = aoiArray[1];
                document.getElementById('EastBBOX').value = aoiArray[2];
                document.getElementById('NorthBBOX').value = aoiArray[3];
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

                          var extentArray = this.target.mapPanel.map.getExtent().toArray();
                          
                          this.westField.setValue(extentArray[0]);
                          this.southField.setValue(extentArray[1]);
                          this.eastField.setValue(extentArray[2]);
                          this.northField.setValue(extentArray[3]); 
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
        ]
        
        return items;
    }        
});

Ext.preg(gxp.plugins.QueryForm.prototype.ptype, gxp.plugins.QueryForm);

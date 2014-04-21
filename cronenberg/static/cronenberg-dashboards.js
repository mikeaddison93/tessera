cronenberg.DashboardHolder = function(url_, element_) {
    this.url = url_;
    this.dashboard = null;
    this.element = element_;

    this.setRange = function(from, until) {
        var self = this;
        var url = URI(self.url);
        if (from) {
            url.setQuery('from', from);
        }
        if (until) {
            url.setQuery('until', until);
        }
        self.url = url.href();
    };
};

cronenberg.DashboardManager = function() {
    this.current = null,

    /**
     * Register an event handler for processing a dashboard once it's
     * loaded and ready.
     */
    this.onDashboardLoaded = function(handler) {
        bean.on(cronenberg.dashboards, cronenberg.events.DASHBOARD_LOADED, handler);
        return this;
    };

    this.load = function(url, element) {
        var self = this;
        self.current = new cronenberg.DashboardHolder(url, element);
        $.ajax({
            dataType: "json",
            url: url
        }).done(function(data) {
            var dashboard = data.entities[0];
            self.current.dashboard = dashboard;

            // Build a map from the presentation elements to their
            // model objects.
            dashboard.elementToItemMap = {};
            _.each(dashboard.grid.rows, function(row) {
                if (row.item_type == 'row') {
                    _.each(row.cells, function(cell) {
                        _.each(cell.presentation, function(presentation) {
                            if (typeof(presentation.element_id) != "undefined") {
                                dashboard.elementToItemMap[presentation.element_id] = presentation;
                            }
                        });
                    });
                }
            });

            // Set up the queries
            cronenberg.queries.clear();
            for (var query_name in dashboard.queries) {
                cronenberg.queries.add(query_name, dashboard.queries[query_name]);
            }

            // Render the dashboard
            var rendered = cronenberg.templates.render(dashboard);
            $(self.current.element).html(rendered);

            var currentURL = URI(self.current.url);

            bean.fire(this, 'ds-range-changed', currentURL.query('from'), currentURL.query('until'));

            // Load the queries
            cronenberg.queries.loadAll();

            bean.fire(cronenberg.dashboards, cronenberg.events.DASHBOARD_LOADED, dashboard);
        });
    };

    this.refresh = function() {
        var self = this;
        if (self.current) {
            self.load(self.current.url);
        }
    };

    this.set_time_range = function(from, until) {
        var self = this;
        var location = URI(window.location).setQuery('from', from).href();
        window.history.pushState({url: self.current.url, element:self.current.element}, '', location);

        self.current.setRange(from, until);
        bean.fire(this, 'ds-range-changed', from, until);
        cronenberg.dashboards.load(self.current.url, self.current.element);
    };

    this.ranges = {
        // TODO - quick hack. Parse the range and generate on the fly
        // for maximum flexibiliy
        '-1h' : 'Past Hour',
        '-2h' : 'Past Two Hours',
        '-3h' : 'Past Three Hours',
        '-4h' : 'Past Four Hours',
        '-6h' : 'Past Six Hours',
        '-1d' : 'Past Day',
        '-7d' : 'Past Week'
    };

    this.onRangeChanged = function(handler) {
        var self = this;
        bean.on(self, 'ds-range-changed', handler);
    };

    this.autoRefreshInterval = null;
    this.intervalId = null;

    this.set_refresh_interval = function(value) {
        var self = this;
        var intervalSeconds = parseInt(value);
        self.autoRefreshInterval = intervalSeconds;
        if (self.intervalId) {
            window.clearInterval(self.intervalId);
        }
        if (intervalSeconds > 0) {
            self.intervalSeconds = intervalSeconds;
            self.intervalId = window.setInterval(self.refresh, intervalSeconds * 1000);
        }
    };
};

cronenberg.dashboards = new cronenberg.DashboardManager();

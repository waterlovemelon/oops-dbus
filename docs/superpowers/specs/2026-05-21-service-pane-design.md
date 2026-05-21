# Service Pane & Enhanced Member Panes Design

## Overview

Add a service-level overview pane and enhance path/interface panes to provide service metadata and monitoring command generation at every tree level.

## ServiceOverviewPane (triggered by clicking service name in sidebar)

### Metadata Card
- Service Name, Unique Name (`:1.xxx`), Owning Process (name + PID), Bus Type
- **Startup Command** — full process command line from `/proc/{pid}/cmdline`, with copy button
- Inactive services show "Not running" for process fields, no startup command

### Service Status in Sidebar
- Green dot + `uniqueName | processCmd` for active services
- Gray dot + "inactive" for inactive services

### Monitoring Commands (tabbed)
- Two command cards: **Monitor Service** and **Monitor Process**
- Each card has tabs: `dbus-monitor` (default) / `busctl` / `gdbus`
- Only one command visible at a time, switched via tab buttons
- Each command has a hover-to-reveal copy button
- Process-level card only shown for active services

## Path Pane (clicking a path node)
- Path metadata: Object Path, Owning Service, Bus Type
- Path-scoped monitoring commands (tabbed, same pattern)

## Interface Pane (clicking an interface node)
- Interface metadata: Interface Name, Object Path, Owning Service, Bus Type
- Stats bar: methods/signals/properties counts
- Interface-scoped monitoring commands (tabbed, same pattern)

## Method Pane (existing, unchanged)
- Method info, argument form, invoke/reset/copy, result view, dbus-send preview

## Signal Pane (new, currently shows generic info)
- Signal info with description
- Subscribe/Unsubscribe toggle button
- Signal-scoped monitoring commands (tabbed)
- dbus-monitor filter preview

## Property Pane (existing, unchanged)
- Property info, get/set, dbus-send preview

## Key Design Decisions
- No Object Paths / Interfaces / Members lists in right pane — sidebar tree handles navigation
- dbus-monitor is the default tab for all monitoring commands
- Process startup command comes from `/proc/{pid}/cmdline`
- Service active state determined by `GetNameOwner` on the well-known name

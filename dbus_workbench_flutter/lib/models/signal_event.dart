/// A received D-Bus signal event, displayed in the signal monitor.
class SignalEvent {
  /// Time the signal was received, formatted as "hh:mm:ss".
  final String time;

  /// The signal topic in "interface.member" form.
  final String topic;

  /// The service (bus name) that emitted the signal.
  final String sender;

  /// The first argument of the signal, toString'd for display.
  final String payload;

  const SignalEvent({
    required this.time,
    required this.topic,
    required this.sender,
    required this.payload,
  });

  @override
  String toString() => 'SignalEvent($topic from $sender at $time)';
}

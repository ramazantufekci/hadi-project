import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/api_config.dart';

class ChatService {
  io.Socket? socket;

  void connect({
    required String token,
  }) {
    socket = io.io(
      ApiConfig.baseUrl,
      io.OptionBuilder()
          .setTransports([
            'websocket',
          ])
          .setAuth({
            'token': token,
          })
          .disableAutoConnect()
          .build(),
    );

    socket!.connect();
  }

  void joinActivity({
    required String activityId,
  }) {
    socket?.emit(
      'join_activity',
      {
        'activityId': activityId,
      },
    );
  }

  void sendMessage({
    required String activityId,
    required String content,
  }) {
    socket?.emit(
      'send_message',
      {
        'activityId': activityId,
        'content': content,
      },
    );
  }

  void onMessage(
    Function(dynamic) callback,
  ) {
    socket?.on(
      'new_message',
      callback,
    );
  }

  void onError(
    Function(dynamic) callback,
  ) {
    socket?.on(
      'error_message',
      callback,
    );
  }

  void disconnect() {
    socket?.disconnect();
    socket?.dispose();
    socket = null;
  }
}

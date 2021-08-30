import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'package:ajoumeow/topbar.dart';
import 'package:ajoumeow/calendar.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: Size(400, 700),
      builder: () => MaterialApp(
        title: 'Welcome to Flutter',
        home: Scaffold(
          body: ListView(
            children: [
              topbarSection,
              Container(
                alignment: Alignment.center,
                height: 50,
                margin: EdgeInsets.only(top: 10, bottom: 20),
                child: Image.asset('assets/images/headline_blue.png'),
              ),
              calendarSection,
            ],
          ),
        ),
        theme: ThemeData(fontFamily: 'Nanum Gothic'),
      ),
    );
  }
}

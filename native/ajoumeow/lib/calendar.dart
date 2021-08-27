import 'package:flutter/material.dart';

Widget calendarSection = Column(
  children: [
    _headerSection,
    Container(
      margin: EdgeInsets.only(top: 10, bottom: 10),
      child: Divider(thickness: 2, color: const Color(0xffF0F4F6)),
    ),
    dateSection,
  ],
);

Widget _headerSection = Row(
  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
  children: [
    Container(
      margin: EdgeInsets.only(left: 5, right: 5),
      child: Text(
        'S',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xffff6666),
        ),
      ),
    ),
    Container(
      margin: EdgeInsets.only(left: 5, right: 5),
      child: Text(
        'M',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xff99A4AE),
        ),
      ),
    ),
    Container(
      margin: EdgeInsets.only(left: 5, right: 5),
      child: Text(
        'T',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xff99A4AE),
        ),
      ),
    ),
    Container(
      margin: EdgeInsets.only(left: 5, right: 5),
      child: Text(
        'W',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xff99A4AE),
        ),
      ),
    ),
    Container(
      margin: EdgeInsets.only(left: 5, right: 5),
      child: Text(
        'T',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xff99A4AE),
        ),
      ),
    ),
    Container(
      margin: EdgeInsets.only(left: 5, right: 5),
      child: Text(
        'F',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xff99A4AE),
        ),
      ),
    ),
    Container(
      margin: EdgeInsets.only(left: 5, right: 5),
      child: Text(
        'S',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: const Color(0xff0080ff),
        ),
      ),
    ),
  ],
);

Widget dateSection = Row(
  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
  children: [],
);

class CalendarDate extends StatefulWidget {
  @override
  _CalendarDateState createState() => _CalendarDateState();
}

class _CalendarDateState extends State<CalendarDate> {
  DateTime date;
  String dateString;

  bool isActive;
  bool isSelected;
  bool isToday;
  bool isMine;

  Map<int, List<String>> courseCrowd;
  Map<String, int> weather;

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}

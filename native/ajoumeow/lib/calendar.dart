import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

import 'package:dart_date/dart_date.dart';

Widget calendarSection = Column(
  children: [
    _headerSection,
    Divider(thickness: 2, color: const Color(0xffF0F4F6)),
    dateSection,
  ],
);

Widget _headerSection = Row(
  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
  children: [
    generateCalendarHeaders('S', const Color(0xffff6666)),
    generateCalendarHeaders('M', const Color(0xff99A4AE)),
    generateCalendarHeaders('T', const Color(0xff99A4AE)),
    generateCalendarHeaders('W', const Color(0xff99A4AE)),
    generateCalendarHeaders('T', const Color(0xff99A4AE)),
    generateCalendarHeaders('F', const Color(0xff99A4AE)),
    generateCalendarHeaders('S', const Color(0xff0080ff)),
  ],
);

Widget generateCalendarHeaders(String text, Color color) {
  return Container(
    width: 0.1.sw,
    child: Center(
      child: Text(
        text,
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    ),
  );
}

Widget dateSection = CalendarDateSection();

class CalendarDateSection extends StatefulWidget {
  @override
  _CalendarDateSectionState createState() => _CalendarDateSectionState();
}

class _CalendarDateSectionState extends State<CalendarDateSection> {
  late DateTime selectedDate;
  final DateTime firstDay = DateTime.now().previousWeek.startOfWeek;

  callback(newSelectedDate) {
    selectedDate = newSelectedDate;
    setState(() => selectedDate = newSelectedDate);
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: generateCalendarDates());
  }

  List<Widget> generateCalendarDates() {
    List<Widget> calendarDates = [];
    final DateTime firstDay = DateTime.now().previousWeek.startOfWeek;
    selectedDate = DateTime.now().startOfDay;

    for (int week = 0; week < 5; week++) {
      List<Widget> rowContent = [];
      for (int day = 0; day < 7; day++) {
        final targetDay = firstDay.addDays(week * 7 + day);
        final datePattern = targetDay.isFirstDayOfMonth || (week * 7 + day) == 0 ? 'M/d' : 'd';
        final dateDifference = targetDay.differenceInDays(DateTime.now().startOfDay);
        final isActive = dateDifference >= 0 && dateDifference < 15;

        rowContent.add(CalendarDate(targetDay, targetDay.format(datePattern), isActive, selectedDate, callback));
      }
      calendarDates.add(
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: rowContent,
        ),
      );
    }
    return calendarDates;
  }
}

class CalendarDate extends StatefulWidget {
  final DateTime date;
  final String dateString;
  final bool isActive;
  final DateTime selectedDate;
  final Function(DateTime) callback;

  CalendarDate(this.date, this.dateString, this.isActive, this.selectedDate, this.callback);

  @override
  _CalendarDateState createState() => _CalendarDateState(selectedDate);
}

class _CalendarDateState extends State<CalendarDate> {
  bool isMine = false;
  DateTime selectedDate;

  Map<int, List<String>> courseCrowd = {};
  Map<String, int> weather = {};

  _CalendarDateState(this.selectedDate);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        widget.callback(widget.date);
      },
      child: Opacity(
        opacity: widget.isActive ? 1 : 0.25,
        child: Container(
          width: 0.13.sw,
          height: 0.13.sw,
          margin: EdgeInsets.only(bottom: 0.01.sw),
          decoration: selectedDate == widget.date
              ? BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(width: 2, color: Colors.white),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.5),
                      spreadRadius: 1,
                      blurRadius: 1,
                      offset: Offset(0, 2),
                    )
                  ],
                  color: const Color(0xFF66DCEC),
                )
              : BoxDecoration(),
          child: Center(
            child: Text(
              widget.dateString,
              style: TextStyle(
                color: !widget.isActive && selectedDate == widget.date ? Colors.white : const Color(0xff424588),
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

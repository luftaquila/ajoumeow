import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

Widget topbarSection = Row(
  children: [
    Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        IconButton(
          icon: FaIcon(FontAwesomeIcons.solidExclamationCircle),
          iconSize: 30,
          padding: EdgeInsets.only(top: 10, left: 10),
          onPressed: () {},
        ),
        IconButton(
          icon: FaIcon(FontAwesomeIcons.questionCircle),
          iconSize: 30,
          padding: EdgeInsets.only(top: 10, left: 0.03.sw),
          onPressed: () {},
        ),
        IconButton(
          icon: FaIcon(FontAwesomeIcons.cameraRetro),
          iconSize: 30,
          padding: EdgeInsets.only(top: 10, left: 0.03.sw),
          onPressed: () {},
        ),
        IconButton(
          icon: FaIcon(FontAwesomeIcons.trophyAlt),
          iconSize: 30,
          padding: EdgeInsets.only(top: 10, left: 0.03.sw),
          onPressed: () {},
        ),
      ],
    ),
    Expanded(
      child: Align(
        alignment: Alignment.centerRight,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            IconButton(
              icon: FaIcon(FontAwesomeIcons.solidStreetView),
              iconSize: 30,
              padding: EdgeInsets.only(top: 10, right: 0.03.sw),
              onPressed: () {},
            ),
            IconButton(
              icon: FaIcon(FontAwesomeIcons.solidBookSpells),
              iconSize: 30,
              padding: EdgeInsets.only(top: 10, right: 0.03.sw),
              onPressed: () {},
            ),
            IconButton(
              icon: FaIcon(FontAwesomeIcons.bars),
              iconSize: 30,
              padding: EdgeInsets.only(top: 10, right: 10),
              onPressed: () {},
            ),
          ],
        ),
      ),
    ),
  ],
);

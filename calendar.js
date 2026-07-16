function Calendar() {
    var MemberID = 0;
    var UserCode = '';
    var DefaultType = '';
    var objCalendar = null;
    var objTypes = null;
    var Date = null;
    var CalendarMode = '';
    var RefNo = '';
    var TeacherCode = '';
    var StudKey = '';
    var DailyMessage = false;
    var HomeWork = false;
    var SubClass = '';
    var Year = '';
    var SubjectNo = 0;
    var objFeeds = null;
}

$(document).ready(function () {
    $(document).on('click', 'div.day_calendar_popup div.calendar_day_events div.event_msg_box li.attachment a, div.calendar_event_popup div.file_attach_tab div.file_attached table.file_attached tbody td a.attachment', function (e) {
        e.preventDefault();

        var fileLocation = $(this).attr('data-id');

        //var fileName = fileLocation.substring(fileLocation.lastIndexOf("\\") + 1);
        //var downloadURL = spider_baseURL + 'Pages/EE65539A79.aspx?filename=' + fileName + '&filepath=' + fileLocation;
        var downloadURL = spider_baseURL + 'Pages/EE65539A79.aspx?filepath=' + fileLocation;
        showDynamicLoader();
        $.fileDownload(downloadURL, {
            successCallback: function (url) {
                //$preparingFileModal.dialog('close');
                hideDynamicLoader();
            },
            failCallback: function (responseHtml, url) {
                showMessage('ERROR', null, responseHtml);
                hideDynamicLoader();
            }
        });
    });

    $(document).on('click', 'div.day_calendar_popup div.calendar_day_panel div.add_new_box button.add_new_event', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var strDate = $(this).attr('data-id');
        var date = getDateFrom(strDate, true);
        var arrRepeatOn = [false, false, false, false, false, false, false];
        var dayIndex = date.getDay();
        if (dayIndex == 0) dayIndex = 6;
        else dayIndex = dayIndex - 1;
        arrRepeatOn[dayIndex] = true;

        var isDMSelected = (Calendar.CalendarMode.length > 4 && Calendar.CalendarMode[4] == 'Y');
        Calendar.PopulateEvent({ Ref: 0, Note: '', DailyMessage: isDMSelected, Type: Calendar.DefaultType, NoteDetail: { ReferTo: Calendar.UserCode, DateFrom: strDate, DateTo: strDate, TimeFrom: '12:00 AM', TimeTo: '12:00 AM', Priority: '3', Comment: '', RepeatType: 'D', RepeatFrequency: 1, RepeatMonthDay: true, RepeatWeekNo: 0, RepeatOn: arrRepeatOn } });
    });

    $(document).on('click', 'div.day_calendar_popup div.calendar_day_events div.event_msg_box button.edit', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var ref = $(this).attr('data-id');
        Calendar_Proxy.GetCalendarNote(ref, Calendar.GetCalendarNoteCallback, showMessage);
    });

    $(document).on('change.db', 'div.calendar_event_popup div.event_details_tab div.form_date', function (e) {
        e.preventDefault();

        Calendar.SetSummary();
    });

    $(document).on('change', 'div.calendar_event_popup div.event_details_tab div.recurrent_detail input.view_summary', function (e) {
        e.preventDefault();
        Calendar.SetSummary();
    });

    $(document).on('change', 'div.calendar_event_popup div.file_attach_tab input.file_type', function (e) {
        e.preventDefault();
        Calendar.SetFileTypeOption();
    });

    $(document).on('change', 'div.calendar_event_popup div.calendar_groups_tab div.student_list_detail input.select_all', function (e) {
        e.preventDefault();
        var isSelected = $(this).prop('checked');
        var arrCheckBoxes = $('div.calendar_event_popup div.calendar_groups_tab div.student_list input[type="checkbox"]');
        var studentIDs = '';
        $.each(arrCheckBoxes, function (index, objCheckBox) {
            $(objCheckBox).prop('checked', isSelected);
        });
    });

    $(document).on('change', 'div.calendar_event_popup div.calendar_groups_tab select.cal_year, div.calendar_event_popup div.calendar_groups_tab select.cal_class', function (e) {
        e.preventDefault();
        var year = $('div.calendar_event_popup div.calendar_groups_tab select.cal_year').val();
        var subClass = $('div.calendar_event_popup div.calendar_groups_tab select.cal_class').val();
        if (year == ' ') year = 'All';
        if (subClass == ' ') subClass = 'All';
        Calendar_Proxy.GetSubjectList(year, subClass, 0, Calendar.GetSubjectListCallback, showMessage);
        Calendar_Proxy.GetTeacherList(year, subClass, 0, ' ', Calendar.GetTeacherListCallback, showMessage);
    });

    $(document).on('change', 'div.calendar_event_popup div.calendar_groups_tab select.cal_subject', function (e) {
        e.preventDefault();
        var year = $('div.calendar_event_popup div.calendar_groups_tab select.cal_year').val();
        var subClass = $('div.calendar_event_popup div.calendar_groups_tab select.cal_class').val();
        var subjectNo = $('div.calendar_event_popup div.calendar_groups_tab select.cal_subject').val();
        if (year == ' ') year = 'All';
        if (subClass == ' ') subClass = 'All';
        Calendar_Proxy.GetTeacherList(year, subClass, subjectNo, ' ', Calendar.GetTeacherListCallback, showMessage);
    });

    $(document).on('change', 'div.calendar_event_popup div.calendar_groups_tab select.cal_teacher', function (e) {
        e.preventDefault();
        var year = $('div.calendar_event_popup div.calendar_groups_tab select.cal_year').val();
        var subClass = $('div.calendar_event_popup div.calendar_groups_tab select.cal_class').val();
        var subjectNo = $('div.calendar_event_popup div.calendar_groups_tab select.cal_subject').val();
        var teacher = $('div.calendar_event_popup div.calendar_groups_tab select.cal_teacher').val();
        if (year == ' ') year = 'All';
        if (subClass == ' ') subClass = 'All';
        Calendar_Proxy.GetStudentList(year, subClass, subjectNo, teacher, null, Calendar.GetStudentListCallback, showMessage);
    });

    $(document).on('click', 'div.calendar_event_popup div.event_details_tab button.save', function (e) {
        e.preventDefault();
        var refNo = $('div.calendar_event_popup').attr('data-id');
        Calendar.SaveCalendarNote(refNo, false);
    });

    $(document).on('click', 'div.calendar_event_popup div.event_details_tab button.publish', function (e) {
        e.preventDefault();
        var refNo = $('div.calendar_event_popup').attr('data-id');
        Calendar.SaveCalendarNote(refNo, true);
    });

    $(document).on('click', 'div.calendar_event_popup div.calendar_groups_tab button.publish', function (e) {
        e.preventDefault();
        var groupID = $(this).attr('data-id');
        var refNo = $('div.calendar_event_popup').attr('data-id');
        var year = $('div.calendar_event_popup div.calendar_groups_tab select.cal_year').val();
        var subClass = $('div.calendar_event_popup div.calendar_groups_tab select.cal_class').val();
        var subjectNo = $('div.calendar_event_popup div.calendar_groups_tab select.cal_subject').val();
        var teacher = $('div.calendar_event_popup div.calendar_groups_tab select.cal_teacher').val();
        var arrCheckBoxes = $('div.calendar_event_popup div.calendar_groups_tab div.student_list input[type="checkbox"]:checked');
        var studentIDs = '';
        $.each(arrCheckBoxes, function (index, objCheckBox) {
            studentIDs += ',' + $(objCheckBox).val();
        });
        if (studentIDs != '') studentIDs = studentIDs.substring(1);
        Calendar_Proxy.SaveCalendarGroup(groupID, refNo, year, subjectNo, teacher, subClass, studentIDs, Calendar.SaveCalendarGroupCallback, showMessage);
    });

    $(document).on('click', 'div.calendar_event_popup div.calendar_groups_tab button.cancel', function (e) {
        e.preventDefault();
        Calendar.SetCalendarGroup(0, ' ', ' ', 0, ' ', null);
    });

    $(document).on('click', 'div.calendar_event_popup div.calendar_groups_tab div.calendar_groups table.calendar_groups tbody button.edit', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var groupID = $(this).attr('data-id');
        Calendar_Proxy.GetCalendarGroups(groupID, 0, Calendar.GetCalendarGroupCallback, showMessage);
    });

    $(document).on('click', 'div.calendar_event_popup div.calendar_groups_tab div.calendar_groups table.calendar_groups tbody button.delete', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var groupID = $(this).attr('data-id');
        if (actionConfirmation('', 'delete', 'group')) Calendar_Proxy.DeleteCalendarGroup(groupID, Calendar.SaveCalendarGroupCallback, showMessage);
    });

    $(document).on('click', 'div.calendar_event_popup div.file_attach_tab button.save', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var fileID = $(this).attr('data-id');
        var refNo = $('div.calendar_event_popup').attr('data-id');
        var fileType = $('div.calendar_event_popup div.file_attach_tab input.file_type:checked').val();
        var displayText = $('div.calendar_event_popup div.file_attach_tab input.display_text').val();
        var fileLocation = $('div.calendar_event_popup div.file_attach_tab input.file_location[type=text]').val();
        if (fileType == 'UPLD') fileLocation = $('div.calendar_event_popup div.file_attach_tab div.calendar_files').html();
        if (fileLocation.trim() == '') {
            showMessage('WARNING', null, 'Please give file location.');
            hideDynamicLoader();
            return;
        }
        else if (displayText.trim() == '') {
            showMessage('WARNING', null, 'Please give display text.');
            hideDynamicLoader();
            return;
        }
        Calendar_Proxy.SaveCalendarFile(fileID, refNo, fileType, displayText, fileLocation, Calendar.SaveCalendarFileCallback, showMessage);
    });

    $(document).on('click', 'div.calendar_event_popup div.file_attach_tab button.cancel', function (e) {
        e.preventDefault();
        Calendar.ClearCalendarFile();
    });

    $(document).on('click', 'div.calendar_event_popup div.file_attach_tab div.file_attached table.file_attached tbody button.edit', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var fileID = $(this).attr('data-id');
        Calendar_Proxy.GetCalendarFiles(fileID, 0, Calendar.GetCalendarFileCallback, showMessage);
    });

    $(document).on('click', 'div.calendar_event_popup div.file_attach_tab div.file_attached table.file_attached tbody button.delete', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var fileID = $(this).attr('data-id');
        if (actionConfirmation('', 'delete', 'attachment')) Calendar_Proxy.DeleteCalendarFile(fileID, Calendar.SaveCalendarFileCallback, showMessage);
    });

    $('div.calendar_event_popup div.file_attach_tab input.file_location[type=file]').fileupload({

        url: spider_baseURL + 'Handlers/FileUploadHandler.ashx?type=CALENDAR',
        dataType: 'json',
        done: function (e, data) {
            $('div.calendar_event_popup div.file_attach_tab div.calendar_files').html(data.files[0].name);
            hideDynamicLoader();
        },
        fail: function (e, data) { hideDynamicLoader(); },
        change: function (e, data) {
            //console.log('ok');
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            showDynamicLoader();
            if (progress == 100) {
            }
        }
    }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');   

    $(document).on('click', 'div.day_calendar_popup div.calendar_day_events div.event_msg_box button.delete', function (e) {
        e.preventDefault();
        showDynamicLoader();
        var ref = $(this).attr('data-id');
        if (actionConfirmation('', 'delete', 'event')) Calendar_Proxy.DeleteCalendarNote(ref, Calendar.DeleteCalendarNoteCallback, showMessage);
    });

    $(document).on('click', 'div.calendar_event_popup button.exit:last, div.calendar_event_popup button.close:first', function (e) {
        e.preventDefault();
        hideModalPopupOnScreen('calendar_event_popup');
    });

    $(document).on('click', 'div.calendar_report_popup button.exit:last, div.calendar_report_popup button.close:first', function (e) {
        e.preventDefault();
        hideModalPopupOnScreen('calendar_report_popup');
    });
});

Calendar.DownloadCalendar = function (type, objData) {
    showDynamicLoader();
    var sParams = 'DOWNLOADTYPE=';
    if (type == 'ICS') sParams += 'CALENDAR';
    //else if (type == 'REPORT') sParams += 'CALENDAR_PDF';
    else sParams += 'CALENDAR_' + type;

    var nMonth = parseInt($('div.calendar_preview div.calendar_left_pane div.export_pane select.month').val());

    var downloadURL = '';
    if (type == 'PDF' && nMonth < 0) {
        Calendar.GetSelectionFormula('PDF');
    }
    else if (type == 'PDF') {
        var inputData = JSON.stringify({
            Year: $('div.calendar_preview div.calendar_left_pane div.export_pane select.year').val(),
            Type: '',
            AccessMode: (Calendar.CalendarMode[1] == "Y" ? '1' : '0'),
            SubYear: $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_year').val(),
            SubClass: $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_class').val(),
            Subject: $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_subject').val(),
            Teacher: Calendar.TeacherCode,
            StudKey: Calendar.StudKey,
            Month: nMonth
        });
        Calendar_Proxy.GetCalendarPDFData(inputData, PDF_Proxy.GetPDFDataCallback, showMessage);
    }
    else if (type == 'REPORT') {
        downloadURL = spider_baseURL + 'Pages/DownloadData.aspx';
        $.fileDownload(downloadURL, {
            httpMethod: 'POST',
            data: objData,
            successCallback: function (url) {
                //$preparingFileModal.dialog('close');
                hideDynamicLoader();
            },
            failCallback: function (responseHtml, url) {
                showMessage('ERROR', null, responseHtml);
                hideDynamicLoader();
            }
        });
    }
    else {
        sParams += '&Year=' + $('div.calendar_preview div.calendar_left_pane div.export_pane select.year').val() +
            '&Type=&AccessMode=' + (Calendar.CalendarMode[1] == "Y" ? '1' : '0') +
            '&SubYear=' + $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_year').val() +
            '&SubClass=' + $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_class').val() +
            '&Subject=' + $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_subject').val() +
            '&Teacher=' + Calendar.TeacherCode + '&StudKey=' + Calendar.StudKey;

        if (type == 'REPORT') {
            sParams += '&Month=-3&FromDate=' + $('div.calendar_report_popup div.calendar_report_detail input.from_date').val() + '&ToDate=' + $('div.calendar_report_popup div.calendar_report_detail input.to_date').val() +
                '&Rep=' + CrystalLayer.ReportAlias;
        }
        else sParams += '&Month=' + nMonth;

        downloadURL = spider_baseURL + 'Pages/EE65539A79.aspx?' + sParams;

        $.fileDownload(downloadURL, {
            successCallback: function (url) {
                //$preparingFileModal.dialog('close');
                hideDynamicLoader();
            },
            failCallback: function (responseHtml, url) {
                showMessage('ERROR', null, responseHtml);
                hideDynamicLoader();
            }
        });
    }

    

    if (type != 'REPORT') $('div.calendar_preview div.calendar_left_pane').toggle('slide');

    //hideDynamicLoader();
}

Calendar.ShowCalendar = function () {
    showDynamicLoader();
    var arrMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    $('div.calendar_preview div.calendar_head_pane span.calendar_head').html(arrMonths[Calendar.Date.getMonth()] + ' ' + Calendar.Date.getFullYear());
    
    var year = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_year').val();
    var strClass = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_class').val();
    var subject = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_subject').val();
    if (year == null) year = '';
    if (strClass == null) strClass = '';
    if (subject == null) subject = 0;
    Calendar_Proxy.GetCalendar(Calendar.Date.getFullYear(), Calendar.Date.getMonth() + 1, '', year, strClass, subject, Calendar.TeacherCode, Calendar.StudKey, Calendar.MemberID, Calendar.GetCalendarEventsCallback, showMessage);
}

Calendar.SearchCalendar = function () {
    showDynamicLoader();
    var arrMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    $('div.calendar_preview div.calendar_head_pane span.calendar_head').html(arrMonths[Calendar.Date.getMonth()] + ' ' + Calendar.Date.getFullYear());

    var year = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_year').val();
    var strClass = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_class').val();
    var subject = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_subject').val();
    if (year == null) year = '';
    if (strClass == null) strClass = '';
    if (subject == null) subject = 0;

    var keyword = $('div.calendar_preview div.calendar_left_pane div.filter_pane input.keyword_search').val();

    var fromDate = new Date(Calendar.Date.getFullYear(), Calendar.Date.getMonth(), 1);
    var toDate = new Date(Calendar.Date.getFullYear(), 11, 31);

    Calendar_Proxy.GetCalendarDateRange(fromDate, toDate, '', year, strClass, subject, Calendar.TeacherCode, Calendar.StudKey, Calendar.MemberID, keyword, Calendar.CalendarSearchCallback, showMessage);
}

Calendar.SaveCalendarNote = function (refNo, publishToAll)
{
    var date = getDateFrom($('div.calendar_event_popup div.event_details_tab input.start_date').val(), true);
    var dateTo = getDateFrom($('div.calendar_event_popup div.event_details_tab input.end_date').val(), true);
    var priority = $('div.calendar_event_popup div.event_details_tab input.cal_priority:checked').val();

    var type = $('div.calendar_event_popup div.event_details_tab select.cal_type').val();
    var note = $('div.calendar_event_popup div.event_details_tab input.cal_note').val();
    if (note == '') {
        Calendar.SetValidationMessage('Please enter note');
        return;
    }
    var referTo = $('div.calendar_event_popup div.event_details_tab input.refer_to').val();
    var comment = $('div.calendar_event_popup div.event_details_tab textarea.comment').val();
    var nTimeFrom = Calendar.GetTimeInMins($('div.calendar_event_popup div.event_details_tab input.start_time').val());
    var nTimeTo = Calendar.GetTimeInMins($('div.calendar_event_popup div.event_details_tab input.end_time').val());
    var dailyMessage = $('div.calendar_event_popup div.event_details_tab input.daily_message').prop('checked');
    var teacherCode = '';
    var studKey = '';
    if (Calendar.CalendarMode.indexOf('T') >= 0) teacherCode = Calendar.UserCode;
    else if (Calendar.CalendarMode.indexOf('S') >= 0) studKey = Calendar.UserCode;

    var repeatType = '';
    var repeatFrequency = 1;
    var repeatMonthDay = true;
    var repeatWeekNo = 0;
    var arrRepeatOn = [false, false, false, false, false, false, false];
    var isWeekDaySelected = false;
    if (dateTo > date) {
        repeatType = $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_type:checked').val();

        repeatFrequency = $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_frequency').val();
        if (repeatFrequency == 0) repeatFrequency = 1;
        repeatMonthDay = $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_day_of_month').prop('checked');
        repeatWeekNo = $('div.calendar_event_popup div.event_details_tab div.summary_box span.summary').attr('data-id');

        if (repeatType == 'W' || repeatType == 'M') {
            isWeekDaySelected = false;
            for (i = 0; i < 7; i++) {
                arrRepeatOn[i] = $($('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_on')[i]).prop('checked');
                if (arrRepeatOn[i]) isWeekDaySelected = true;
            }

            if ((repeatType == 'W' || (repeatType == 'M' && !repeatMonthDay)) && !isWeekDaySelected) {
                Calendar.SetValidationMessage('Please select atleat one week day from Repeat On');
                return;
            }
        }
    }

    if (Calendar.HomeWork) Calendar_Proxy.SaveCalendarNote(date, dateTo, priority, refNo, type, note, referTo, comment, nTimeFrom, nTimeTo, dailyMessage, false, teacherCode, studKey, repeatType, repeatFrequency, repeatMonthDay, repeatWeekNo, arrRepeatOn[0], arrRepeatOn[1], arrRepeatOn[2], arrRepeatOn[3], arrRepeatOn[4], arrRepeatOn[5], arrRepeatOn[6], Calendar.SaveCalendarNoteCallback, showMessage);
    else Calendar_Proxy.SaveCalendarNote(date, dateTo, priority, refNo, type, note, referTo, comment, nTimeFrom, nTimeTo, dailyMessage, publishToAll, teacherCode, studKey, repeatType, repeatFrequency, repeatMonthDay, repeatWeekNo, arrRepeatOn[0], arrRepeatOn[1], arrRepeatOn[2], arrRepeatOn[3], arrRepeatOn[4], arrRepeatOn[5], arrRepeatOn[6], Calendar.SaveCalendarNoteCallback, showMessage);
}

Calendar.SaveCalendarNoteCallback = function (data) {
    try {
        var nRef = data.d;
        if (Calendar.HomeWork) {
            Calendar_Proxy.SaveCalendarGroup(0, nRef, Calendar.Year, Calendar.SubjectNo, Calendar.TeacherCode, Calendar.SubClass, '', Calendar.SaveCalendarGroupCallback, showMessage);
        }
        //else {
            hideModalPopupOnScreen('calendar_event_popup');
            var strDate = $('div.calendar_event_popup div.event_details_tab input.start_date').val();
            Calendar.ShowDayCalendar(strDate, false);
        //}
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.SaveCalendarNoteCallback', e);
    }
}

Calendar.SaveCalendarFileCallback = function (data) {
    try {
        var response = data.d;
        var refNo = $('div.calendar_event_popup').attr('data-id');
        Calendar_Proxy.GetCalendarFiles(0, refNo, Calendar.GetCalendarFilesCallback, showMessage);
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.SaveCalendarFileCallback', e);
    }
}

Calendar.SaveCalendarGroupCallback = function (data) {
    try {
        var response = data.d;
        /*if (Calendar.HomeWork) {
            hideModalPopupOnScreen('calendar_event_popup');
        }
        else {*/
            var refNo = $('div.calendar_event_popup').attr('data-id');
            Calendar_Proxy.GetCalendarGroups(0, refNo, Calendar.GetCalendarGroupsCallback, showMessage);
        //}
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.SaveCalendarGroupCallback', e);
    }
}

Calendar.GetCalendarFilesCallback = function (data) {
    try {
        var objFiles = data.d;

        Calendar.PopulateCalendarFiles(objFiles);
        hideDynamicLoader();
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.GetCalendarFilesCallback', e);
    }
}

Calendar.GetCalendarFileCallback = function (data) {
    try {
        var objFiles = data.d;

        if (objFiles != null) {
            $.each(objFiles, function (index, objFile) {
                $('div.calendar_event_popup div.file_attach_tab button.save').attr('data-id', objFile.FileID);

                $('div.calendar_event_popup div.file_attach_tab input.display_text').val(objFile.Text);
                $('div.calendar_event_popup div.file_attach_tab input.file_location[type=text]').val(objFile.File);
                $('div.calendar_event_popup div.file_attach_tab div.calendar_files').html('');

                $('div.calendar_event_popup div.file_attach_tab input.file_type[value="' + objFile.Type + '"]').closest('label').click();
            });
        }

        hideDynamicLoader();
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.GetCalendarFileCallback', e);
    }
}

Calendar.GetCalendarGroupsCallback = function (data) {
    try {
        var objGroups = data.d;

        Calendar.PopulateCalendarGroups(objGroups);
        hideDynamicLoader();
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.GetCalendarGroupsCallback', e);
    }
}

Calendar.GetCalendarGroupCallback = function (data) {
    try {
        var objGroups = data.d;

        if (objGroups != null) {
            $.each(objGroups, function (index, objGroup) {
                Calendar.SetCalendarGroup(objGroup.GroupID, objGroup.Year, objGroup.Class, objGroup.Subject, objGroup.Teacher, objGroup.Students);
            });
        }

        hideDynamicLoader();
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.GetCalendarGroupCallback', e);
    }
}

Calendar.DeleteCalendarNoteCallback = function (data) {
    try {
        var response = data.d;
        
        var strDate = $('div.day_calendar_popup div.calendar_day_panel div.add_new_box button.add_new_event').attr('data-id');
        Calendar.ShowDayCalendar(strDate, false);
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.DeleteCalendarNoteCallback', e);
    }
}

Calendar.GetCalendarTypesCallback = function (data) {
    try {
        Calendar.objTypes = eval(data.d);

        var sHtml = '<li data-id=""><span style="background-color:#AAAAAA;"> </span> Select All </li>';
        //var tickStyle = '';
        var objType = null;
        var ddlCalendarType = $('div.calendar_event_popup div.event_details_tab select.cal_type');

        $(ddlCalendarType).html('');
        
        var arrSortedByOrder = [];
        $.each(Calendar.objTypes, function (index, item) {
            item.Show = true;
            arrSortedByOrder.push({ 'Code': item.Code, 'SortOrder': item.SortOrder });            
        });
        arrSortedByOrder.sort(function (a, b) { return (a.SortOrder - b.SortOrder) });

        $.each(arrSortedByOrder, function (index, item) {
            objType = Calendar.objTypes[item.Code];

            if (Calendar.CalendarMode.length > 3 && Calendar.CalendarMode[3] == 'G' && (objType.Code == 'PM' || objType.Code == 'HW')) objType.Access = '0000';
            else {                
                if (objType.Access[1] == '1' || objType.Access[2] == '1') {
                    if (Calendar.DefaultType == null || Calendar.DefaultType == '') Calendar.DefaultType = objType.Code;
                    $(ddlCalendarType).append($('<option></option>').val(objType.Code).html(objType.Name));
                }
               // if (objType.Code.startsWith('FEED')) tickStyle = 'class="untick"';
                //else tickStyle = '';
                sHtml += '<li data-id="' + objType.Code + '"><span style="background-color:#' + objType.Color + ';"> </span> ' + objType.Name + ' </li>';
            }
        });
        $('div.calendar_preview div.calendar_left_pane ul.calendar_types').html(sHtml);
        $(ddlCalendarType).selectedIndex = 0;

        Calendar.ShowCalendar();        
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.GetCalendarTypesCallback', e);
    }
}

Calendar.GetCalendarEventsCallback = function (data) {
    try {
        Calendar.objCalendar = eval(data.d);
        //console.log(Calendar.objCalendar);
        var isFeedsExists = false;
        
        /*if (!$.isEmptyObject(Calendar.objFeeds)) {
            $.each(Calendar.objFeeds, function (index, item) {
                if (item.Link != '') {
                    if (Calendar.objCalendar.Types['FEED' + index] == null) Calendar.objCalendar.Types['FEED' + index] = {
                        Code: 'FEED' + index,
                        Color: Calendar.objTypes['FEED' + index].Color
                    };

                    var fromDate = Calendar.objCalendar.Weeks[0].Days[0].Date;
                    var toDate = Calendar.objCalendar.Weeks[Calendar.objCalendar.Weeks.length - 1].Days[6].Date;
                    Calendar_Proxy.GetSharedCalendar('FEED' + index, item.Link, fromDate, toDate, Calendar.GetSharedCalendarCallback, showMessage);
                    isFeedsExists = true;
                }
            });
        }
        if (!isFeedsExists) */
        Calendar.PopulateCalendar('', true);

    } catch (e) {
        hideDynamicLoader();
        showMessage('ERROR', 'Getting Calendar.GetCalendarEventsCallback', e);        
    }
}

Calendar.GetCalendarReportDataCallback = function (data) {
    try {
        var response = data.d;
        var objData = {};
        objData['TYPE'] = 'PDF';
        objData['FILENAME'] = 'Calendar';
        objData['DATA'] = response;
        Calendar.DownloadCalendar('REPORT', objData);

    } catch (e) {
        hideDynamicLoader();
        showMessage('ERROR', 'Getting Calendar.GetCalendarReportDataCallback', e);
    }
}

/*
Calendar.GetCalendarDateRangeCallback = function (data) {
    try {
        var response = eval(data.d);
        var objCalTypes = null;
        
        var sRefs = ',';
        $.each(response.Dates, function (index, objDate) {
            $.each(objDate.Refs, function (rIndex, sRef) {
                objNote = response.Notes[sRef];
                //objNote = Calendar.objCalendar.Notes[sRef];
                if (objNote != null && objNote.Show) {
                    if (Calendar.objTypes == null || (Calendar.objTypes[objNote.Type] != null && Calendar.objTypes[objNote.Type].Show)) {
                        sRef = sRef.substring(1);
                        sRef = sRef.replace('DM', '');
                        if (!sRef.startsWith('PI') && !sRef.startsWith('HD') && !sRef.startsWith('FEED') && sRefs.indexOf(',' + sRef + ',') < 0) sRefs += sRef + ',';
                    }
                }
            });
        });
        if (sRefs != '') sRefs = ';REFNO=' + sRefs.substring(1, sRefs.length - 1);
        else sRefs = ';REFNO=0';

        CrystalLayer.SelectionFormula = 'FROMDATE=' + $('div.calendar_report_popup div.calendar_report_detail input.from_date').val() + ';TODATE=' + $('div.calendar_report_popup div.calendar_report_detail input.to_date').val() + sRefs;
        CrystalLayer_Proxy.SetReportLaunchSession(CrystalLayer.LaunchMode, CrystalLayer.ReportAlias, CrystalLayer.SelectionFormula, CrystalLayer.SetReportLaunchSessionCallBack, showMessage);

    } catch (e) {
        hideDynamicLoader();
        showMessage('ERROR', 'Getting Calendar.GetCalendarDateRangeCallback', e);
    }
}
*/
Calendar.CalendarSearchCallback = function (data) {
    try {
        var objCalSearch = eval(data.d);
        
        var sHtml = '';
        var nCount = 0;
        var sDateTD = '';
        var sTime = '';
        var arrEvents = {};
        var sDate = '';
        $.each(objCalSearch.Dates, function (index, objDate) {
            sDate = objDate.Date.split('/').reverse().join('');
            arrEvents[sDate] = '';
            sDateTD = '<td class="view_item" {0}> <a data-id="' + objDate.Date + '">' + getDateFrom(objDate.Date).toLocaleString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + '</a> </td>';
            nCount = 0;
            $.each(objDate.Refs, function (rIndex, nRef) {
                objNote = objCalSearch.Notes[nRef];
                if (objNote != null && objNote.Show) {
                    sColor = objCalSearch.Types[objNote.Type].Color;                
                    sTime = '';
                    if (objNote.NoteDetail.TimeFrom != '') sTime = objNote.NoteDetail.TimeFrom;
                    if (objNote.NoteDetail.TimeTo != '') sTime += ' - ' + objNote.NoteDetail.TimeTo;
                    if (sTime == '') sTime = 'All Day';
                    arrEvents[sDate] += '<tr>' + sDateTD + '<td> ' + sTime + ' </td><td><b style="color:#' + sColor + ';">' + objNote.Note + ' </b> - ' + objNote.NoteDetail.Comment + ' </td></tr>';
                    nCount++;
                    sDateTD = '';                    
                }
            });
            if (nCount > 1) arrEvents[sDate] = arrEvents[sDate].replace('{0}', ' rowspan="' + nCount + '"');
            else arrEvents[sDate] = arrEvents[sDate].replace('{0}', '');
        });

        
        $.each(objCalSearch.Weeks, function (wIndex, objWeek) {
            //sHtml += '<tr><td colspan="3" class="view_item"><b> Week ' + objWeek.Week + '</b></td></tr>';
            $.each(objWeek.Days, function (dIndex, objDay) {
                sDate = objDay.Date.split('/').reverse().join('');
                
                if (arrEvents[sDate] != null) sHtml += arrEvents[sDate];
            });
        });

        $('div.calendar_search_popup div.calendar_search table.calendar_search tbody').html(sHtml);

        showModalPopupOnScreen('calendar_search_popup');

        hideDynamicLoader();
    } catch (e) {
        hideDynamicLoader();
        showMessage('ERROR', 'Getting Calendar.CalendarSearchCallback', e);
    }
}

Calendar.GetDayCalendarCallback = function (data, strDate) {
    try {
        var objDayCalendar = eval(data.d);
        console.log(objDayCalendar);
        var arrPriority = { P0: { Name: 'Normal', Color: 'E1E1E1' }, P1: { Name: 'Highest', Color: 'FF0000' }, P2: { Name: 'High', Color: 'FFAA00' }, P3: { Name: 'Normal', Color: 'E1E1E1' }, P4: { Name: 'Low', Color: 'FFFF00' }, P5: { Name: 'Lowest', Color: 'FFFFAA' } };
        var sHtml = '';
        var fileStyle = '';
        var objNote = null;
        var arrEvents = [];
        var sAccess = '';
        var priority = 0;

        if (Calendar.CalendarMode[0] == 'Y') {
            $('div.calendar_day_panel button.add_new_event').attr('data-id', strDate);
            $('div.calendar_day_panel div.add_new_box').show();
        }
        if (Calendar.DailyMessage) {            
            $('div.calendar_day_panel div.daily_message_box').show();
            $('div.calendar_day_panel div.print_box').show();
            $('div.calendar_day_panel div.daily_message_box input.goto_date').val(strDate);
        }        
        if (Calendar.HomeWork) {
            $('div.calendar_day_panel div.daily_message_box').show();
            $('div.calendar_day_panel div.daily_message_box input.goto_date').val(strDate);
        }

        sHtml = ' Priority: &nbsp;&nbsp;';
        $.each(arrPriority, function (index, objPriority) {
            if(index != 'P0') sHtml += ' <i class="glyphicon glyphicon-exclamation-sign" style="color: #' + objPriority.Color + ';"> </i> ' + objPriority.Name;
        });
        $('div.calendar_day_panel div.event_priorities').html(sHtml);
        sHtml = '';
        var nRef = 0;
        //console.log(objDayCalendar);
        
        var sType = '';
        if (Calendar.RefNo == 'RDM0') sType = 'DM';
        else if (Calendar.RefNo == 'RPI0') sType = 'PI';
        if (sType != '') Calendar.RefNo = '';

        $.each(objDayCalendar.Dates, function (index, objDate) {
            $.each(objDate.Refs, function (rIndex, sRef) {
                nRef = sRef.substring(1);                
                if (Calendar.RefNo == '' || Calendar.RefNo == sRef) {                    
                    objNote = objDayCalendar.Notes[sRef];
                    
                    if (sType == '' || (sType == 'DM' && objNote.DailyMessage) || (sType == 'PI' && objNote.Type == 'PI')) {
                        if (Calendar.objTypes == null || Calendar.objTypes[objNote.Type] == null) sAccess = '0000';
                        else if (Calendar.CalendarMode.length > 3 && Calendar.CalendarMode[3] == 'G') sAccess = '0000';
                        else sAccess = Calendar.objTypes[objNote.Type].Access;
                        if (objNote != null && objNote.Show) {
                            if (arrEvents[objNote.Type] == null) arrEvents[objNote.Type] = '';
                            priority = objNote.NoteDetail.Priority;
                            if (priority < 0 || priority > 5) priority = 0;
                            arrEvents[objNote.Type] += '<div class="event_msg_box"><h5><i class="glyphicon glyphicon-exclamation-sign" style="color: #' + arrPriority['P' + priority].Color + ';"> </i> ' + objNote.Note;
                            if (objNote.NoteDetail.Location != null && objNote.NoteDetail.Location != '') arrEvents[objNote.Type] += ' (' + objNote.NoteDetail.Location + ')';
                            arrEvents[objNote.Type] += '<ul class="events_things list-unstyled"><li> ';
                            if (sAccess[2] == '1') arrEvents[objNote.Type] += '<button type="button" class="btn btn-success btn-xs edit" data-id="' + nRef + '"><i class="glyphicon glyphicon-edit"></i> Edit</button>  ';
                            if (sAccess[3] == '1' || (objNote.Ref > 0 && objNote.Type == 'ACP')) arrEvents[objNote.Type] += '<button type="button" class="btn btn-danger btn-xs delete" data-id="' + nRef + '"><i class="glyphicon glyphicon-remove"></i> Delete</button>';
                            arrEvents[objNote.Type] += '</li><li class="bg-warning"><i class="glyphicon glyphicon-time"> </i> When: <small>' + objNote.NoteDetail.DateFrom + ' ' + objNote.NoteDetail.TimeFrom + ' to ' + objNote.NoteDetail.DateTo + ' ' + objNote.NoteDetail.TimeTo + '</small> </li>' +
                                '<li class="bg-success"><i class="glyphicon glyphicon-share"> </i> Refer To: <small> ' + objNote.NoteDetail.ReferTo + ' </small> </li> ' +
                                '</ul></h5>' +
                                '<p> ' + objNote.NoteDetail.Comment.replace(/\n/g, '<br/>') + '</p><ul class="events_things list-unstyled">';
                            if (objNote.NoteDetail.Files != null) {
                                $.each(objNote.NoteDetail.Files, function (fIndex, objFile) {
                                    if (objFile.Type == 'HLNK') {// ? 'link' : 'paperclip');
                                        arrEvents[objNote.Type] += '<li class="bg-info"><a href="' + objFile.File + '" target="_blank"><i class="glyphicon glyphicon-link"> </i> <small> ' + objFile.Text + '</small> </a> </li> ';
                                    }
                                    else {
                                        arrEvents[objNote.Type] += '<li class="bg-info attachment"><a href="#" target="_blank" data-id="' + objFile.File + '"><i class="glyphicon glyphicon-paperclip"> </i> <small> ' + objFile.Text + '</small> </a> </li> ';
                                    }
                                });
                            }
                            arrEvents[objNote.Type] += '</ul><div class="clear"> </div></div>';
                        }
                    }
                }
            });
        });
        
        $.each(objDayCalendar.Types, function (index, objType) {
            if (arrEvents[index] != null) {
                sHtml += '<div class="panel panel-default"><div class="panel-heading" style="background-color: #' + objType.Color + ';color: ' + Calendar.GetForeColor(objType.Color) + ';" role="tab" id="heading' + index + '">' +
                    '<h4 class="panel-title"> <span role="button" data-toggle="collapse" data-parent="#accordion" style="cursor:pointer;" href="#collapse' + index + '" aria-expanded="true" aria-controls="collapse' + index + '"> ' + objType.Name + '</span> </h4>' +
                            '</div><div id="collapse' + index + '" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading' + index + '"><div class="panel-body"> ';
                sHtml += arrEvents[index] + '</div></div></div>';
            }
        });

        $('div.day_calendar_popup div.calendar_day_events').html(sHtml);

        hideDynamicLoader();
    } catch (e) {
        hideDynamicLoader();
        showMessage('ERROR', 'Getting Calendar.GetDayCalendarCallback', e);
    }
}

Calendar.GetCalendarNoteCallback = function (data) {
    try {
        var objEvent = eval(data.d);

        Calendar.PopulateEvent(objEvent);

        hideDynamicLoader();
    } catch (e) {
        hideDynamicLoader();
        showMessage('ERROR', 'Getting Calendar.GetCalendarNoteCallback', e);
    }
}

Calendar.GetYearListCallback = function (data) {
    try {
        var response = eval(data.d);
        var ddlYear = $('div.calendar_event_popup div.calendar_groups_tab select.cal_year');
        var ddlSearchYear = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_year');
        $(ddlYear).html('');
        $(ddlSearchYear).html('');
        $(ddlYear).append($('<option></option>').val(' ').html('All'));
        $(ddlSearchYear).append($('<option></option>').val('').html('All'));
        $.each(response, function (index, item) {
            $(ddlYear).append($('<option></option>').val(item.Value).html(item.Key));
            $(ddlSearchYear).append($('<option></option>').val(item.Value).html(item.Key));
        });

        $(ddlYear).selectedIndex = 0;
        $(ddlSearchYear).selectedIndex = 0;

    } catch (e) {
        showMessage('ERROR', 'Getting GetYearListCallback', e);
    }
}

Calendar.GetClassListCallback = function (data) {
    try {
        var response = eval(data.d);
        var ddlClass = $('div.calendar_event_popup div.calendar_groups_tab select.cal_class');
        var ddlSearchClass = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_class');
        var strText = '';
        $(ddlClass).html('');
        $(ddlSearchClass).html('');
        $(ddlClass).append($('<option></option>').val(' ').html('All'));
        $(ddlSearchClass).append($('<option></option>').val('').html('All'));
        $.each(response, function (index, item) {
            if (item.RecNum != -1) {
                strText = item.Value + ' - ' + item.Key;
                $(ddlClass).append($('<option></option>').val(item.Value).html(strText));
                $(ddlSearchClass).append($('<option></option>').val(item.Value).html(strText));
            }
        });
    } catch (e) {
        showMessage('ERROR', 'Getting GetClassListCallback', e);
    }
}

Calendar.GetSubjectListCallback = function (data, subjectNo) {
    try {
        var response = eval(data.d);
        var ddlSubject = $('div.calendar_event_popup div.calendar_groups_tab select.cal_subject');
        var ddlSearchSubject = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_subject');
        var populateSearch = ($(ddlSearchSubject).html() == '');
        $(ddlSubject).html('');
        $(ddlSubject).append($('<option></option>').val('0').html('All'));
        if (populateSearch)
        {
            $(ddlSearchSubject).append($('<option></option>').val('0').html('All'));
        }
        $.each(response, function (index, item) {
            $(ddlSubject).append($('<option></option>').val(item.SubjectNo).html(item.Name));
            if (populateSearch) $(ddlSearchSubject).append($('<option></option>').val(item.SubjectNo).html(item.Name));
        });

        $(ddlSubject).val(subjectNo);
        $(ddlSearchSubject).val(subjectNo);
    } catch (e) {
        showMessage('ERROR', 'Getting GetSubjectListCallback', e);
    }
}

Calendar.GetTeacherListCallback = function (data, teacher) {
    try {
        var response = eval(data.d);
        var ddlTeacher = $('div.calendar_event_popup div.calendar_groups_tab select.cal_teacher');

        $(ddlTeacher).html('');
        $(ddlTeacher).append($('<option></option>').val(' ').html('All'));
        $.each(response, function (index, item) {
            $(ddlTeacher).append($('<option></option>').val(index).html(item));
        });

        $(ddlTeacher).val(teacher);

    } catch (e) {
        showMessage('ERROR', 'Getting GetTeacherListCallback', e);
    }
}

Calendar.GetStudentListCallback = function (data, objSelStudents) {
    try {
        var objStudents = eval(data.d);
        var sHtml = '';
        var selected = '';
        $('div.calendar_event_popup div.calendar_groups_tab div.student_list').html('');
        $.each(objStudents, function (index, student) {
            if (objSelStudents == null || objSelStudents[student.StudentKey] == null) selected = '';
            else selected = 'checked';
            sHtml += '<div class="checkbox"><label><input type="checkbox" value="' + student.StudentID + '" ' + selected + '>' + student.StudentKey + ' </label></div>';
        });

        $('div.calendar_event_popup div.calendar_groups_tab div.student_list').html(sHtml);

        $('div.calendar_event_popup div.calendar_groups_tab div.student_list_detail input.select_all').prop('checked', false);

        if (sHtml == '') $('div.calendar_event_popup div.calendar_groups_tab div.student_list_detail input.select_all').prop('disabled', true);
        else $('div.calendar_event_popup div.calendar_groups_tab div.student_list_detail input.select_all').prop('disabled', false);        
        
    } catch (e) {
        showMessage('ERROR', 'Getting GetStudentListCallback', e);
    }
}

Calendar.GetCalendarFeedCallback = function (data) {
    try {
        Calendar.objFeeds = eval(data.d);
        var ddlFeeds = $('div.calendar_preview div.calendar_left_pane div.share_pane select.share_name');

        $(ddlFeeds).html('');
        $(ddlFeeds).append($('<option></option>').val('0_0').html('Select a Type'));
        $.each(Calendar.objFeeds, function (index, item) {
            if (item.FeedID != 0 || item.Link == '') $(ddlFeeds).append($('<option></option>').val(index).html(item.Name));
        });

        //Calendar.ShowCalendar();
    } catch (e) {
        showMessage('ERROR', 'Getting GetCalendarFeedCallback', e);
    }
}

Calendar.SaveCalendarFeedCallback = function (data) {
    try {
        var response = data.d;
        Calendar_Proxy.GetCalendarFeeds(0, Calendar.MemberID, Calendar.GetCalendarFeedCallback, showMessage);
        $('div.calendar_preview div.calendar_left_pane div.share_pane input.share_link').val('');
    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.SaveCalendarFeedCallback', e);
    }
}

/*Calendar.GetSharedCalendarCallback = function (data) {
    try {
        var response = data.d;
        //console.log('ok');
        //console.log(response);
        var arrDate = null;
        $.each(response.Dates, function (index, objDate) {
            arrDate = $.grep(Calendar.objCalendar.Dates, function (d) { return d.Date == objDate.Date; });            
            if (arrDate.length == 0) {
                Calendar.objCalendar.Dates.push(objDate);
            }
            else {
                $.each(objDate.Refs, function (rIndex, ref) {
                    arrDate[0].Refs.push(ref);
                });
            }
        });

        $.each(response.Notes, function (rIndex, objNote) {
            Calendar.objCalendar.Notes[rIndex] = objNote;
        });        

        Calendar.PopulateCalendar('', true);

    } catch (e) {
        showMessage('ERROR', 'Getting Calendar.SaveCalendarFeedCallback', e);
    }
}*/

Calendar.PopulateCalendar = function(type, isSelected)
{
    var sHtml = '';
    var objNote = null;
    var arrEvents = [];
    var sDate = '';
    var dayStyle = '';
    var sColor = '';
    var arrDate = null;
    var strFromDate = '';
    var strToDate = '';
    var sNote = '';
    
    //console.log(Calendar.objCalendar);

    $.each(Calendar.objCalendar.Notes, function (rIndex, objNote) {        
        if (type == '' || objNote.Type == type) {
            if (isSelected) objNote.Show = true;
            else objNote.Show = false;            
        }        
    });

    /*var objDates = {};
    var arrRefs = [];
    $.each(Calendar.objCalendar.Dates, function (index, objDate) {
        sDate = objDate.Date.split('/').reverse().join('');        
        arrRefs = [];
        $.each(objDate.Refs, function (rIndex, nRef) {
            objNote = Calendar.objCalendar.Notes[nRef];
            if (objNote != null && objNote.Show) {
                arrRefs.push({ Time: GetTimeInMins(objNote.NoteDetail.TimeFrom), Ref: nRef });
            }
        });
        //arrRefs.sort(function (a, b) { return (a.Time - b.Time) });
        objDates[sDate] = arrRefs;
    });*/
    
    $.each(Calendar.objCalendar.Dates, function (index, objDate) {
        sDate = objDate.Date.split('/').reverse().join('');
        arrEvents[sDate] = '';

        $.each(objDate.Refs, function (rIndex, nRef) {
        //$.each(objDates[sDate], function (rIndex, objRef) {
            //nRef = objRef.Ref;
            objNote = Calendar.objCalendar.Notes[nRef];

            //sColor = Calendar.objCalendar.Types[objNote.Type].Color;            
            if (objNote != null && objNote.Show) {
                if (Calendar.objTypes != null && Calendar.objTypes[objNote.Type] != null) sColor = Calendar.objTypes[objNote.Type].Color;
                else sColor = Calendar.objCalendar.Types[objNote.Type].Color;   
                
                sNote = ''
                if (objNote.NoteDetail.TimeFrom != '') sNote = objNote.NoteDetail.TimeFrom;
                
                if (objNote.NoteDetail.TimeTo != '') {
                    if (sNote != '') sNote += ' - ';
                    sNote += objNote.NoteDetail.TimeTo;
                }
                if (sNote != '') sNote += ' ';
                sNote += objNote.Note;
                if (objNote.NoteDetail.Location != null && objNote.NoteDetail.Location != '') sNote += ' (' + objNote.NoteDetail.Location + ')';
                arrEvents[sDate] += '<div class="calendar_content_box" style="background-color:#' + sColor + ';color:' + Calendar.GetForeColor(sColor) + ';" data-id="' + nRef + '"> ' + (objNote.HasAttachment ? '<i class="glyphicon glyphicon-paperclip"> </i> ' : '') + sNote + ' </div>';
            }
        });
    });

    $.each(Calendar.objCalendar.Weeks, function (wIndex, objWeek) {
        sHtml += '<tr><td class="view_item weekno"><a href="#" class="open">' + objWeek.Week + '</a></td>';
        $.each(objWeek.Days, function (dIndex, objDay) {
            if (strFromDate == '') strFromDate = objDay.Date;
            strToDate = objDay.Date;
            
            arrDate = objDay.Date.split('/').reverse();
            sDate = arrDate.join('');
            if (objDay.SchoolDay == 'W' || objDay.SchoolDay == 'H') dayStyle = 'holiday';
            else dayStyle = '';
            if ((new Date(arrDate.join('-'))).getMonth() != Calendar.Date.getMonth()) dayStyle += ' othermonth';
            sHtml += '<td><h3 style="background-color:#' + objDay.Color + ';" class="' + dayStyle + '" data-id="' + objDay.Date + '">' + objDay.DayName + '</h3>';
            if (arrEvents[sDate] != null) sHtml += arrEvents[sDate];
            sHtml += '</td>';
        });
        sHtml += '</tr>';
    });   

    $('div.calendar_report_popup div.calendar_report_detail input.from_date').val(strFromDate);
    $('div.calendar_report_popup div.calendar_report_detail input.to_date').val(strToDate);

    $('div.calendar_preview div.calendar_pane table.table-calendar tbody').html(sHtml);    
    
    $('div.calendar_preview div.calendar_left_pane div.publish_pane textarea.publish_link').val(Calendar.objCalendar.Link);

    var strDate = $('div.calendar_preview div.calendar_head_pane div.date_control input.goto_date').val();
    
    if ($('div.calendar_preview div.calendar_pane table.table-calendar tbody td h3[data-id="' + strDate + '"]').offset() != null) {
        var nTop = $('div.calendar_preview div.calendar_pane table.table-calendar tbody td h3[data-id="' + strDate + '"]').offset().top - $('div.calendar_preview div.calendar_pane table.table-calendar tbody td h3:first').offset().top;
        $('html, body').animate({ scrollTop: nTop }, 'slow');
    }
    hideDynamicLoader();
}

Calendar.PopulateEvent = function (objEvent) {
    
    $('div.calendar_event_popup').attr('data-id', objEvent.Ref);
    $('div.calendar_event_popup').attr('data-caltype', objEvent.Type);

    $('div.calendar_event_popup div.event_details_tab input.cal_note').val(objEvent.Note);
    $('div.calendar_event_popup div.event_details_tab select.cal_type').val(objEvent.Type);
    $('div.calendar_event_popup div.event_details_tab input.refer_to').val(objEvent.NoteDetail.ReferTo);
    $('div.calendar_event_popup div.event_details_tab input.daily_message').prop('checked', objEvent.DailyMessage);

    $('div.calendar_event_popup div.event_details_tab input.start_date').val(objEvent.NoteDetail.DateFrom);
    $('div.calendar_event_popup div.event_details_tab input.end_date').val(objEvent.NoteDetail.DateTo);

    if (objEvent.NoteDetail.TimeFrom == '') $('div.calendar_event_popup div.event_details_tab input.start_time').val('12:00 AM');
    else $('div.calendar_event_popup div.event_details_tab input.start_time').val(objEvent.NoteDetail.TimeFrom);
    $('div.calendar_event_popup div.event_details_tab input.start_time').trigger('change');

    if (objEvent.NoteDetail.TimeTo == '') $('div.calendar_event_popup div.event_details_tab input.end_time').val('12:00 AM');
    else $('div.calendar_event_popup div.event_details_tab input.end_time').val(objEvent.NoteDetail.TimeTo);
    $('div.calendar_event_popup div.event_details_tab input.end_time').trigger('change');

    $('div.calendar_event_popup div.event_details_tab input.cal_priority[value=' + objEvent.NoteDetail.Priority + ']').prop('checked', true);
    $('div.calendar_event_popup div.event_details_tab textarea.comment').val(objEvent.NoteDetail.Comment);

    if (objEvent.NoteDetail.RepeatType != null) {
        $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_type[value=' + objEvent.NoteDetail.RepeatType + ']').closest('label').click();
        $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_frequency').val(objEvent.NoteDetail.RepeatFrequency);

        if (objEvent.NoteDetail.RepeatMonthDay) $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_day_of_month').closest('label').click();
        else $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_day_of_week').closest('label').click();

        $('div.calendar_event_popup div.event_details_tab div.summary_box span.summary').attr('data-id', objEvent.NoteDetail.RepeatWeekNo);

        for (i = 0; i < 7; i++) {
            if (objEvent.NoteDetail.RepeatOn[i]) $($('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_on')[i]).prop('checked', true);
            else $($('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_on')[i]).prop('checked', false);
        }
    }
    Calendar.SetSummary();

    var sAccess = '0000';
    //console.log(Calendar.objTypes);
    if (Calendar.objTypes != null && Calendar.objTypes[objEvent.Type] != null) sAccess = Calendar.objTypes[objEvent.Type].Access;

    if (sAccess[1] == '1' || sAccess[2] == '1') {
        $('div.calendar_event_popup div.file_attach_tab div.calendar_file_detail').show();
        if (objEvent.Type == 'ACP') {
            $('div.calendar_event_popup div.calendar_groups_tab div.calendar_group_detail').hide();
            $('div.calendar_event_popup div.calendar_groups_tab div.student_list_detail').hide();
            $('div.calendar_event_popup div.event_details_tab div.button_box').hide();
        }
        else {
            if (objEvent.Type == 'PM' || objEvent.Type == 'HW') {
                $('div.calendar_event_popup div.calendar_groups_tab div.calendar_group_detail').hide();
                $('div.calendar_event_popup div.calendar_groups_tab div.student_list_detail').hide();
            }
            else {
                $('div.calendar_event_popup div.calendar_groups_tab div.calendar_group_detail').show();
                $('div.calendar_event_popup div.calendar_groups_tab div.student_list_detail').show();
            }
            $('div.calendar_event_popup div.event_details_tab div.button_box').show();
        }
    }
    else
    {
        $('div.calendar_event_popup div.calendar_groups_tab div.calendar_group_detail').hide();
        $('div.calendar_event_popup div.calendar_groups_tab div.student_list_detail').hide();
        $('div.calendar_event_popup div.file_attach_tab div.calendar_file_detail').hide();
        $('div.calendar_event_popup div.event_details_tab div.button_box').hide();
    }

    Calendar.SetFileTypeOption();

    if (objEvent.Ref == 0) {
        $('div.calendar_event_popup div.calendar_groups_tab button.publish').hide();
        $('div.calendar_event_popup div.file_attach_tab button.save').hide();
    }
    else {
        $('div.calendar_event_popup div.calendar_groups_tab button.publish').show();
        $('div.calendar_event_popup div.file_attach_tab button.save').show();
    }
    Calendar.PopulateCalendarGroups(objEvent.NoteDetail.Groups);

    Calendar.PopulateCalendarFiles(objEvent.NoteDetail.Files);
    
    showModalPopupOnScreen('calendar_event_popup');
    hideDynamicLoader();
}

Calendar.PopulateCalendarFiles = function (objFiles)
{
    var nIndex = 1;
    var sHtml = '';
    var type = $('div.calendar_event_popup').attr('data-caltype');
    var sAccess = '0000';
    if (Calendar.objTypes != null && Calendar.objTypes[type] != null) sAccess = Calendar.objTypes[type].Access;

    if (objFiles != null) {
        $.each(objFiles, function (index, objFile) {
            sHtml += '<tr><td>' + (nIndex++) + '</td>';
            if (objFile.Type == 'HLNK') sHtml += '<td><a href="' + objFile.File + '" target="_blank"><i class="glyphicon glyphicon-link"> </i> ' + objFile.Text + '</a></td>';
            else sHtml += '<td><a href="#" target="_blank" class="attachment" data-id="' + objFile.File + '"><i class="glyphicon glyphicon-paperclip"> </i> ' + objFile.Text + ' </a></td>';
            sHtml += '<td class="text-center">';
            if (sAccess[2] == '1') sHtml += '<button class="btn btn-success btn-xs edit" title="Edit" data-id="' + objFile.FileID + '"><i class="glyphicon glyphicon-edit"> </i></button>';
            if (sAccess[3] == '1') sHtml += '&nbsp;<button class="btn btn-danger btn-xs delete" title="delete" data-id="' + objFile.FileID + '"><i class="glyphicon glyphicon-remove"> </i></button>';
            sHtml += '</td></tr>';
        });
    }
    $('div.calendar_event_popup div.file_attach_tab div.file_attached table.file_attached tbody').html(sHtml);
    Calendar.ClearCalendarFile();
}

Calendar.PopulateCalendarGroups = function (objGroups) {
    var sHtml = '';
    var nIndex = 1;
    var selectedStudents = '';
    var type = $('div.calendar_event_popup').attr('data-caltype');
    var sAccess = '0000';
    if (Calendar.objTypes != null && Calendar.objTypes[type] != null) sAccess = Calendar.objTypes[type].Access;

    if (objGroups != null) {
        $.each(objGroups, function (index, objGroup) {
            selectedStudents = '';
            sHtml += '<tr><td>' + (nIndex++) + '</td><td>' + objGroup.Year + '</td><td>' + objGroup.Class + '</td><td>' + objGroup.SubjectName + '</td>' +
                        '<td>' + objGroup.Teacher + '</td><td>';
            if (objGroup.Students != null) {
                $.each(objGroup.Students, function (studKey, studentID) {
                    selectedStudents += ', ' + studKey;
                });
                if (selectedStudents != '') sHtml += selectedStudents.substring(2);
            }
            sHtml += '</td><td class="text-center">';
            if (type != 'ACP' && type != 'PM' && type != 'HW') {
                if (sAccess[2] == '1') sHtml += '<button class="btn btn-success btn-xs edit" title="Edit" data-id="' + objGroup.GroupID + '"><i class="glyphicon glyphicon-edit"> </i></button>';
                if (sAccess[3] == '1') sHtml += '&nbsp;<button class="btn btn-danger btn-xs delete" title="delete" data-id="' + objGroup.GroupID + '"><i class="glyphicon glyphicon-remove"> </i></button>';
            }
            sHtml += '</td></tr>';
        });
    }
    $('div.calendar_event_popup div.calendar_groups_tab div.calendar_groups table.calendar_groups tbody').html(sHtml);

    if (nIndex > 1) {
        $('div.calendar_event_popup div.event_details_tab button.publish').hide();
        $('div.calendar_event_popup div.event_details_tab button.save').html('<i class="glyphicon glyphicon-save"> </i> Save Event');
    }
    else {
        $('div.calendar_event_popup div.event_details_tab button.publish').show();
        $('div.calendar_event_popup div.event_details_tab button.save').html('<i class="glyphicon glyphicon-save"> </i> Save Event as Draft');
    }


    Calendar.SetCalendarGroup(0, ' ', ' ', 0, ' ', null);
}

Calendar.SetCalendarGroup = function(groupID, year, subClass, subjectNo, teacher, objStudents)
{
    $('div.calendar_event_popup div.calendar_groups_tab button.publish').attr('data-id', groupID);

    $('div.calendar_event_popup div.calendar_groups_tab select.cal_year').val(year);

    $('div.calendar_event_popup div.calendar_groups_tab select.cal_class').val(subClass);

    if (year == ' ') year = 'All';
    if (subClass == ' ') subClass = 'All';

    Calendar_Proxy.GetSubjectList(year, subClass, subjectNo, Calendar.GetSubjectListCallback, showMessage);
    Calendar_Proxy.GetTeacherList(year, subClass, subjectNo, teacher, Calendar.GetTeacherListCallback, showMessage);
    Calendar_Proxy.GetStudentList(year, subClass, subjectNo, teacher, objStudents, Calendar.GetStudentListCallback, showMessage);
}

Calendar.ClearCalendarFile = function () {
    $('div.calendar_event_popup div.file_attach_tab button.save').attr('data-id', '0');

    $('div.calendar_event_popup div.file_attach_tab input.display_text').val('');
    $('div.calendar_event_popup div.file_attach_tab input.file_location[type=text]').val('');
    $('div.calendar_event_popup div.file_attach_tab div.calendar_files').html('');

    Calendar.SetFileTypeOption();
}

Calendar.SetFileTypeOption = function ()
{
    var type = $('div.calendar_event_popup').attr('data-caltype');
    
    var sAccess = '0000';
    if (Calendar.objTypes != null && Calendar.objTypes[type] != null) sAccess = Calendar.objTypes[type].Access;

    if ($('div.calendar_event_popup div.file_attach_tab input.file_type:checked').val() == 'UPLD') {
        if (sAccess[1] == '1' || sAccess[2] == '1') {
            $('div.calendar_event_popup div.file_attach_tab div.file_location').show();
            $('div.calendar_event_popup div.file_attach_tab div.calendar_files').show();
        }
        else
        {
            $('div.calendar_event_popup div.file_attach_tab div.file_location').hide();
            $('div.calendar_event_popup div.file_attach_tab div.calendar_files').hide();
        }
        $('div.calendar_event_popup div.file_attach_tab input.file_location[type=text]').hide();
    }
    else {
        $('div.calendar_event_popup div.file_attach_tab div.file_location').hide();
        $('div.calendar_event_popup div.file_attach_tab div.calendar_files').hide();
        $('div.calendar_event_popup div.file_attach_tab input.file_location[type=text]').show();
    }
}

Calendar.ShowDayCalendar = function (strDate, isNewPopup)
{
    showDynamicLoader();
    var date = getDateFrom(strDate, true);

    var year = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_year').val();
    var strClass = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_class').val();
    var subject = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_subject').val();
    if (year == null) year = '';
    if (strClass == null) strClass = '';
    if (subject == null) subject = 0;
    var type = '';
    if (Calendar.HomeWork) {
        type = 'HW';
        year = Calendar.Year;
        subject = Calendar.SubjectNo;
        strClass = Calendar.SubClass;
    }
    
    Calendar_Proxy.GetDayCalendar(strDate, type, year, strClass, subject, Calendar.TeacherCode, Calendar.StudKey, Calendar.MemberID, Calendar.GetDayCalendarCallback, showMessage);

    $('div.day_calendar_popup h4 span.calendar_name').html(' - ' + date.toLocaleString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    if (isNewPopup)
    {        
        showModalPopupOnScreen('day_calendar_popup');
    }
}

Calendar.GetSelectionFormula = function (reportType) {
    showDynamicLoader();
    var subYear = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_year').val();
    var subClass = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_class').val();
    var subject = $('div.calendar_preview div.calendar_left_pane div.search_pane div.more_search select.cal_subject').val();
    if (subYear == null) subYear = '';
    if (subClass == null) subClass = '';
    if (subject == null) subject = 0;

    var sFromDate = '';
    var sToDate = '';

    var adminMode = (Calendar.CalendarMode[1] == 'Y');
    var nYear = 0;
    var nMonth = 0;
    var sReportName = '';
    if (reportType == 'REPORT') {
        nMonth = -3;
        sFromDate = $('div.calendar_report_popup div.calendar_report_detail input.from_date').val();
        sToDate = $('div.calendar_report_popup div.calendar_report_detail input.to_date').val();
        sReportName = CrystalLayer.ReportAlias;
    }
    else {
        nMonth = $('div.calendar_preview div.calendar_left_pane div.export_pane select.month').val();
        nYear = $('div.calendar_preview div.calendar_left_pane div.export_pane select.year').val();
    }

    Calendar_Proxy.GetCalendarReportData(sReportName, sFromDate, sToDate, nMonth, nYear, '', subYear, subClass, subject, Calendar.TeacherCode, Calendar.StudKey, Calendar.MemberID, adminMode, Calendar.GetCalendarReportDataCallback, showMessage);
    //Calendar.DownloadCalendar('REPORT');
    //Calendar_Proxy.GetCalendarDateRange(fromDate, toDate, '', year, strClass, subject, Calendar.TeacherCode, Calendar.StudKey, Calendar.MemberID, '', Calendar.GetCalendarDateRangeCallback, showMessage);
}

Calendar.SetSummary = function ()
{
    var frequencyType = '';
    var repeatType = $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_type:checked').val();
    if (repeatType == 'D') frequencyType = 'Days';
    else if (repeatType == 'W') frequencyType = 'Weeks';
    else if (repeatType == 'M') frequencyType = 'Months';    

    var summary = '';
    var strDateFrom = $('div.calendar_event_popup div.event_details_tab input.start_date').val();
    var strDateTo = $('div.calendar_event_popup div.event_details_tab input.end_date').val();    
    
    //$('div.calendar_event_popup div.event_details_tab div.summary_box span.summary').attr('data-id', '0');

    var date = getDateFrom(strDateFrom);
    var dateTo = getDateFrom(strDateTo);
    if (dateTo > date) {
        $('div.calendar_event_popup div.event_details_tab div.recurrent_detail').show();
        var repeatFrequency = $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_frequency').val();

        if (repeatType == 'D') {
            frequencyType = 'Days';
            if (repeatFrequency == '1') summary = 'Daily';
            else summary = 'Every ' + repeatFrequency + ' day';
        }
        else if (repeatType == 'W') {
            frequencyType = 'Weeks';
            if (repeatFrequency == '1') summary = 'Weekly on ';
            else summary = 'Every ' + repeatFrequency + ' week on ';
            summary += Calendar.GetWeeksSelected(repeatType);
        }
        else if (repeatType == 'M') {
            frequencyType = 'Months';
            if (repeatFrequency == '1') summary = 'Monthly on ';
            else summary = 'Every ' + repeatFrequency + ' month on ';

            if ($('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_day_of_month').prop('checked')) summary += 'day ' + date.getDate();
            else summary += ' the ' + Calendar.GetWeekPrefix(date) + Calendar.GetWeeksSelected(repeatType);
        }

        summary += ', until ' + strDateTo;
    }
    else {
        $('div.calendar_event_popup div.event_details_tab div.recurrent_detail').hide();
        summary = 'On ' + strDateFrom;
    }
    $('div.calendar_event_popup div.event_details_tab div.recurrent_detail span.repeat_frequency').html(frequencyType);
    $('div.calendar_event_popup div.event_details_tab div.summary_box span.summary').html(summary);
}

Calendar.GetForeColor = function (sBackColor) {

    var sForeColor = '#000000';
    var nLength = 0;
    var sDigit = '';
    var nDigit = 0;
    var nR = 0;
    var nG = 0;
    var nB = 0;

    if (sBackColor != '') {
        nLength = sBackColor.length;
        sBackColor = sBackColor.toUpperCase();
        for (i = 0; i < nLength; i++) {
            sDigit = sBackColor.substring(i, i + 1);
            if (sDigit == 'A') nDigit = 10;
            else if (sDigit == 'B') nDigit = 11;
            else if (sDigit == 'C') nDigit = 12;
            else if (sDigit == 'D') nDigit = 13;
            else if (sDigit == 'E') nDigit = 14;
            else if (sDigit == 'F') nDigit = 15;
            else if (isNaN(sDigit)) nDigit = 0;
            else nDigit = parseInt(sDigit);

            if (i % 2 == 0) nDigit = nDigit * 16;

            if (i < 2) nR = nR + nDigit;
            else if (i < 4) nG = nG + nDigit;
            else if (i < 6) nB = nB + nDigit;
        }
        if (1 - ((0.299 * nR + 0.587 * nG + 0.114 * nB) / 255) >= 0.7) sForeColor = '#FFFFFF';
    }
    return (sForeColor);
}

Calendar.GetWeeksSelected = function(repeatType)
{
        var selected = "";        

        var arrCheckBoxes = $('div.calendar_event_popup div.event_details_tab div.recurrent_detail input.repeat_on:checked');

        if (arrCheckBoxes.length == 7) {
            if (repeatType == "W") selected = "all days ";
            else if (repeatType == "M") selected = " week ";
        }
        else {
            $.each(arrCheckBoxes, function (index, objCheckBox) {                
                selected += ', ' + $(objCheckBox).val();
            });
            if (selected != "") selected = selected.substring(2);
        }

        if (selected != '') $('div.calendar_event_popup div.event_details_tab div.button_box label.lbl_message').html('');
        return (selected);    
}

Calendar.SetValidationMessage = function (sMessage) {
    $('div.calendar_event_popup div.event_details_tab div.button_box label.lbl_message').html(sMessage);
}

Calendar.GetWeekPrefix = function(date) {
    var prefixes = ["first ", "second ", "third ", "fourth ", "fifth "];
    var weekNo = (0 | date.getDate() / 7);
    $('div.calendar_event_popup div.event_details_tab div.summary_box span.summary').attr('data-id',  '' + (weekNo + 1));
    return (prefixes[weekNo]);
}

Calendar.AddMonth = function (date, nMonth)
{
    date.setMonth(date.getMonth() + nMonth);
    return (date);
}

Calendar.GetTimeInMins = function (strTime) {
    var nTime = 0;
    var arrTime = strTime.split(' ');
    var strAmPm = '';
    var nHours = 0;
    var nMinutes = 0;
    if (arrTime.length == 2) {   
        strAmPm = arrTime[1].toUpperCase();
        arrTime = arrTime[0].split(':');
        if (arrTime.length == 2) {
            nHours = parseInt(arrTime[0]);
            nMinutes = parseInt(arrTime[1]);
            if (nHours == 12) nTime = 0;
            else nTime = nHours * 60;
            nTime += nMinutes;

            if (strAmPm == 'PM') nTime += 720;
        }
    }    
    return (nTime);
}
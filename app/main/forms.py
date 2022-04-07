from flask_wtf import FlaskForm
from flask_wtf.recaptcha import validators
from wtforms import StringField, SubmitField ,TextAreaField
from wtforms.validators import DataRequired, Length, Regexp, EqualTo
from wtforms import ValidationError
from ..models import Room
from flask import flash

class CodeForm(FlaskForm):
    code = StringField('Roomcode', validators=[
        DataRequired(), Length(1, 64),
        Regexp('^[A-Za-z0-9_.]*$', 0, 'Room code must have only letters, numbers, dots or underscores')])
    roomname = StringField('Roomname', validators=[
        DataRequired(), Length(1, 64),
        Regexp('^[A-Za-z0-9_.\sㄱ-ㅣ가-힣]*$', 0, 'Room name must have only letters, numbers, dots or underscores')])
    submit = SubmitField('만들기')
    
    def validate_code(self, field):
        if Room.query.filter_by(room_code = field.data).first():
            flash('Code already in used.')
            raise ValidationError("Code already in used.")
        
        
class CommentForm(FlaskForm):
    body = TextAreaField("Comment", validators = [DataRequired()])
    submit = SubmitField('Submit')
    
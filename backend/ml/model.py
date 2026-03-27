#!/usr/bin/env python3
import sys, json, os, numpy as np

def train_model():
    try:
        import pandas as pd
        from sklearn.linear_model import LinearRegression
        dataset_path = os.path.join(os.path.dirname(__file__), '../../dataset/study_planner_dataset.csv')
        if not os.path.exists(dataset_path): raise FileNotFoundError()
        df = pd.read_csv(dataset_path)
        X = df[["Mid_Scaled", "Daily_Scaled"]].values
        y = df["Semester_100"].values
        return LinearRegression().fit(X, y)
    except: return None

def main():
    if len(sys.argv) < 2: sys.exit(1)
    data = json.loads(sys.argv[1])
    exam_mode = data.get('examMode','semester')
    diff_level = data.get('diffLevel','normal')
    subjects = data.get('subjects',[])
    max_mark = 30 if exam_mode=='mid' else 100
    multiplier = {'easy':0.75,'normal':1.0,'brutal':1.15}.get(diff_level,1.0)
    model = train_model()
    predictions = []
    for sub in subjects:
        written,assign,attend = int(sub.get('written',18)),int(sub.get('assign',4)),int(sub.get('attend',7))
        daily_perc = ((assign+attend)/15)*100
        mid_perc = daily_perc if exam_mode=='mid' else ((min(written+assign,30)/30)*100)
        if model:
            try:
                raw = float(model.predict(np.array([[mid_perc,daily_perc]]))[0])
                predicted = max(0,min(int(round((raw*multiplier/100)*max_mark)),max_mark))
            except: predicted = min(int(round(((mid_perc+daily_perc)/2*multiplier/100)*max_mark)),max_mark)
        else: predicted = min(int(round(((mid_perc+daily_perc)/2*multiplier/100)*max_mark)),max_mark)
        predictions.append(predicted)
    print(json.dumps(predictions))

if __name__=='__main__': main()

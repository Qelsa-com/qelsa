import { Building, CheckSquare, Clock, DollarSign, ExternalLink, Gift, MapPin, Star, Users, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface JobDetails {
  company: string;
  location: string;
  salary?: string;
  workType?: string;
  experience: string;
  responsibilities: string[];
  requirements: string[];
  preferred: string[];
  benefits: string[];
}

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobDescription: string;
  jobDetails: JobDetails;
  onApply: () => void;
  onCheckFit: () => void;
}

export function JobDetailsModal({ isOpen, onClose, jobTitle, jobDescription, jobDetails, onApply, onCheckFit }: JobDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{jobTitle}</h2>
              <p className="text-teal-600 font-medium">{jobDetails.company}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-teal-600" />
                <div>
                  <p className="text-sm text-teal-700">Salary</p>
                  <p className="font-semibold text-teal-900">{jobDetails.salary}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700">Location</p>
                  <p className="font-semibold text-blue-900">{jobDetails.location.split(",")[0]}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-700">Work Type</p>
                  <p className="font-semibold text-purple-900">{jobDetails.workType}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-700">Experience</p>
                  <p className="font-semibold text-orange-900">{jobDetails.experience}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Job Description */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Role</h3>
            <p className="text-gray-700 leading-relaxed">{jobDescription}</p>
          </Card>

          {/* Responsibilities */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Key Responsibilities</h3>
            </div>
            <ul className="space-y-3">
              {jobDetails.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{responsibility}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Requirements */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Required Qualifications</h3>
            </div>
            <ul className="space-y-3">
              {jobDetails.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Preferred Qualifications */}
          {jobDetails.preferred.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Preferred Qualifications</h3>
              </div>
              <ul className="space-y-3">
                {jobDetails.preferred.map((preferred, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{preferred}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Benefits */}
          <Card className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Benefits & Perks</h3>
            </div>
            <ul className="space-y-3">
              {jobDetails.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Posted by {jobDetails.company} • Active hiring</div>
            <div className="flex gap-3">
              <Button onClick={onCheckFit} variant="outline" className="border-teal-300 text-teal-600 hover:bg-teal-50">
                Check My Fit
              </Button>
              <Button onClick={onApply} className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
